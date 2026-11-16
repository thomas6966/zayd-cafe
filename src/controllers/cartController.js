// Mijoz (Mini App) API: menyu, narx hisoblash (promo-kod), buyurtma berish
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyNewOrder } = require('./botController');

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

class BadRequest extends Error {}

// Promo-kodni tekshiradi. Xato bo'lsa xabar matnini qaytaradi.
function checkPromo(promo, subtotal) {
  if (!promo || !promo.isActive) return "Promo-kod topilmadi";
  if (promo.expiresAt && promo.expiresAt < new Date()) return 'Promo-kod muddati tugagan';
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return 'Promo-kod limiti tugagan';
  if (subtotal < promo.minOrder) return `Minimal buyurtma summasi: ${new Intl.NumberFormat('ru-RU').format(promo.minOrder)} so'm`;
  return null;
}

// Narxlar to'liq serverda hisoblanadi — mijozga ishonilmaydi
async function priceCart({ items, deliveryType, promoCode }) {
  if (!Array.isArray(items) || items.length === 0) throw new BadRequest("Savat bo'sh");

  const ids = [...new Set(items.map((i) => Number(i.productId)))];
  const [products, addons, settings] = await Promise.all([Product.findByIds(ids), Product.listAddons(true), Product.getSettings()]);
  const byId = new Map(products.map((p) => [p.id, p]));
  const addonById = new Map(addons.map((a) => [a.id, a]));

  const lines = [];
  let subtotal = 0;
  for (const i of items) {
    const p = byId.get(Number(i.productId));
    const qty = Math.floor(Number(i.quantity));
    if (!p || !p.isAvailable) throw new BadRequest(`"${p ? p.name : 'Mahsulot'}" hozir mavjud emas`);
    if (!(qty >= 1 && qty <= 50)) throw new BadRequest("Miqdor noto'g'ri");

    // Faqat shu kategoriyaga tegishli faol qo'shimchalar hisobga olinadi
    const chosen = [...new Set((i.addonIds || []).map(Number))]
      .map((id) => addonById.get(id))
      .filter((a) => a && a.categoryIds.includes(p.categoryId));
    const unit = p.price + chosen.reduce((s, a) => s + a.price, 0);
    subtotal += unit * qty;
    lines.push({
      productId: p.id, name: p.name, price: unit, quantity: qty,
      note: i.note ? String(i.note).slice(0, 200) : null,
      addons: chosen.length ? chosen.map((a) => ({ id: a.id, name: a.name, price: a.price })) : undefined,
    });
  }

  let discount = 0;
  let promo = null;
  let promoError = null;
  if (promoCode && String(promoCode).trim()) {
    const found = await Order.findPromo(promoCode);
    promoError = checkPromo(found, subtotal);
    if (!promoError) {
      discount = found.type === 'PERCENT' ? Math.floor((subtotal * found.value) / 100) : Math.min(found.value, subtotal);
      promo = { code: found.code, type: found.type, value: found.value };
    }
  }

  let deliveryFee = 0;
  if (deliveryType === 'DELIVERY') {
    const free = settings.freeDeliveryFrom > 0 && subtotal - discount >= settings.freeDeliveryFrom;
    deliveryFee = free ? 0 : settings.deliveryFee;
  }

  return { lines, subtotal, discount, deliveryFee, total: subtotal - discount + deliveryFee, promo, promoError, settings };
}

const getMenu = asyncH(async (req, res) => {
  res.json(await Product.getPublicMenu());
});

// Qo'shimchalar va sozlamalar (mijozga ko'rinadigan)
const getConfig = asyncH(async (req, res) => {
  const [addons, settings] = await Promise.all([Product.listAddons(true), Product.getSettings()]);
  res.json({ addons, settings });
});

const quote = asyncH(async (req, res) => {
  try {
    const q = await priceCart(req.body || {});
    const { lines, ...rest } = q;
    res.json(rest);
  } catch (e) {
    if (e instanceof BadRequest) return res.status(400).json({ error: e.message });
    throw e;
  }
});

const createOrder = asyncH(async (req, res) => {
  const { deliveryType, paymentMethod = 'CASH', phone, address, latitude, longitude, comment } = req.body || {};

  if (!['PICKUP', 'DELIVERY'].includes(deliveryType)) return res.status(400).json({ error: "Yetkazish turi noto'g'ri" });
  if (!['CASH', 'TERMINAL'].includes(paymentMethod)) return res.status(400).json({ error: "To'lov turi noto'g'ri" });
  const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
  if (cleanPhone.replace(/\D/g, '').length < 9) return res.status(400).json({ error: "Telefon raqamini to'g'ri kiriting" });
  const hasGeo = Number.isFinite(latitude) && Number.isFinite(longitude);
  if (deliveryType === 'DELIVERY' && !(address && String(address).trim()) && !hasGeo) {
    return res.status(400).json({ error: 'Manzilni kiriting yoki lokatsiyani yuboring' });
  }

  let q;
  try {
    q = await priceCart(req.body);
  } catch (e) {
    if (e instanceof BadRequest) return res.status(400).json({ error: e.message });
    throw e;
  }
  if (q.promoError) return res.status(400).json({ error: q.promoError });
  if (q.settings.minOrder > 0 && q.subtotal < q.settings.minOrder) {
    return res.status(400).json({ error: `Minimal buyurtma summasi: ${new Intl.NumberFormat('ru-RU').format(q.settings.minOrder)} so'm` });
  }

  await User.setPhone(req.user.id, cleanPhone);
  const order = await Order.create({
    userId: req.user.id,
    deliveryType, paymentMethod, phone: cleanPhone,
    address: address ? String(address).slice(0, 300) : null,
    latitude: hasGeo ? latitude : null,
    longitude: hasGeo ? longitude : null,
    comment: comment ? String(comment).slice(0, 300) : null,
    subtotal: q.subtotal, discount: q.discount, deliveryFee: q.deliveryFee, promoCode: q.promo?.code || null,
    total: q.total,
    items: { create: q.lines },
  });
  if (q.promo) Order.usePromo(q.promo.code).catch((e) => console.error('[promo]', e.message));

  notifyNewOrder(order).catch((e) => console.error('[notify]', e.message));
  res.status(201).json(order);
});

const myOrders = asyncH(async (req, res) => {
  res.json(await Order.findByUser(req.user.id));
});

const getOrder = asyncH(async (req, res) => {
  const order = await Order.findById(Number(req.params.id));
  if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  res.json(order);
});

module.exports = { getMenu, getConfig, quote, createOrder, myOrders, getOrder };
