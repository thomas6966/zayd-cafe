// Admin Panel API: buyurtmalar va menyu CRUD
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { notifyStatus } = require('./botController');

const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const STATUSES = ['NEW', 'PREPARING', 'READY', 'DELIVERING', 'COMPLETED', 'CANCELLED'];

const me = (req, res) => res.json({ ok: true });

const listOrders = asyncH(async (req, res) => {
  const { status } = req.query;
  if (status && !STATUSES.includes(status)) return res.status(400).json({ error: "Status noto'g'ri" });
  const [orders, counts] = await Promise.all([Order.list(status), Order.countByStatus()]);
  res.json({ orders, counts });
});

const getOrder = asyncH(async (req, res) => {
  const order = await Order.findById(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  res.json(order);
});

const setStatus = asyncH(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Status noto'g'ri" });
  const existing = await Order.findById(Number(req.params.id));
  if (!existing) return res.status(404).json({ error: 'Buyurtma topilmadi' });
  if (status === 'DELIVERING' && existing.deliveryType !== 'DELIVERY') {
    return res.status(400).json({ error: "Olib ketish buyurtmasi uchun \"yo'lda\" statusi yo'q" });
  }
  const order = await Order.updateStatus(existing.id, status);
  if (existing.status !== status) notifyStatus(order).catch((e) => console.error('[notify]', e.message));
  res.json(order);
});

// ---- Menyu CRUD ----
const getMenu = asyncH(async (req, res) => res.json(await Product.getFullMenu()));

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
const CAT_KEYS = ['name', 'emoji', 'sortOrder', 'isActive'];

const createCategory = asyncH(async (req, res) => {
  const data = pick(req.body || {}, CAT_KEYS);
  if (!data.name || !String(data.name).trim()) return res.status(400).json({ error: 'Kategoriya nomi kerak' });
  res.status(201).json(await Product.createCategory(data));
});
const updateCategory = asyncH(async (req, res) => {
  res.json(await Product.updateCategory(Number(req.params.id), pick(req.body || {}, CAT_KEYS)));
});
const deleteCategory = asyncH(async (req, res) => {
  await Product.deleteCategory(Number(req.params.id));
  res.json({ ok: true });
});

const cleanProduct = (b) => {
  const d = pick(b || {}, ['name', 'description', 'price', 'imageUrl', 'isAvailable', 'sortOrder', 'categoryId']);
  if (d.price !== undefined) d.price = Math.round(Number(d.price));
  if (d.categoryId !== undefined) d.categoryId = Number(d.categoryId);
  if (d.imageUrl === '') d.imageUrl = null;
  return d;
};
const createProduct = asyncH(async (req, res) => {
  const d = cleanProduct(req.body);
  if (!d.name || !(d.price >= 0) || !d.categoryId) return res.status(400).json({ error: 'Nom, narx va kategoriya kerak' });
  res.status(201).json(await Product.createProduct(d));
});
const updateProduct = asyncH(async (req, res) => {
  const d = cleanProduct(req.body);
  if (d.price !== undefined && !(d.price >= 0)) return res.status(400).json({ error: "Narx noto'g'ri" });
  res.json(await Product.updateProduct(Number(req.params.id), d));
});
const deleteProduct = asyncH(async (req, res) => {
  await Product.deleteProduct(Number(req.params.id));
  res.json({ ok: true });
});

// ---- Statistika, mijozlar, qo'shimchalar, promo-kodlar, sozlamalar ----
const stats = asyncH(async (req, res) => res.json(await Order.getStats()));
const customers = asyncH(async (req, res) => res.json(await User.listCustomers()));

const addonData = (b) => {
  const d = pick(b || {}, ['name', 'nameRu', 'price', 'categoryIds', 'isActive', 'sortOrder']);
  if (d.price !== undefined) d.price = Math.max(0, Math.round(Number(d.price) || 0));
  if (d.categoryIds !== undefined) d.categoryIds = (Array.isArray(d.categoryIds) ? d.categoryIds : []).map(Number).filter(Number.isInteger);
  return d;
};
const listAddons = asyncH(async (req, res) => res.json(await Product.listAddons()));
const createAddon = asyncH(async (req, res) => {
  const d = addonData(req.body);
  if (!d.name || !String(d.name).trim()) return res.status(400).json({ error: 'Nomi kerak' });
  res.status(201).json(await Product.createAddon(d));
});
const updateAddon = asyncH(async (req, res) => res.json(await Product.updateAddon(Number(req.params.id), addonData(req.body))));
const deleteAddon = asyncH(async (req, res) => { await Product.deleteAddon(Number(req.params.id)); res.json({ ok: true }); });

const promoData = (b) => {
  const d = pick(b || {}, ['code', 'type', 'value', 'minOrder', 'maxUses', 'expiresAt', 'isActive']);
  if (d.code !== undefined) d.code = String(d.code).trim().toUpperCase();
  if (d.value !== undefined) d.value = Math.round(Number(d.value));
  if (d.minOrder !== undefined) d.minOrder = Math.max(0, Math.round(Number(d.minOrder) || 0));
  if (d.maxUses !== undefined) d.maxUses = d.maxUses === '' || d.maxUses === null ? null : Math.round(Number(d.maxUses));
  if (d.expiresAt !== undefined) d.expiresAt = d.expiresAt ? new Date(d.expiresAt + 'T23:59:59+05:00') : null;
  return d;
};
const validPromo = (d, partial) => {
  if (!partial && !d.code) return 'Kodni kiriting';
  if (d.type !== undefined && !['PERCENT', 'FIXED'].includes(d.type)) return "Turi noto'g'ri";
  if (d.value !== undefined && !(d.value > 0)) return "Qiymat 0 dan katta bo'lishi kerak";
  if (d.type === 'PERCENT' && d.value > 100) return "Foiz 100 dan oshmasligi kerak";
  return null;
};
const listPromos = asyncH(async (req, res) => res.json(await Order.listPromos()));
const createPromo = asyncH(async (req, res) => {
  const d = promoData(req.body);
  const err = validPromo(d, false);
  if (err) return res.status(400).json({ error: err });
  try { res.status(201).json(await Order.createPromo(d)); }
  catch (e) { if (e.code === 'P2002') return res.status(400).json({ error: 'Bunday kod allaqachon mavjud' }); throw e; }
});
const updatePromo = asyncH(async (req, res) => {
  const d = promoData(req.body);
  const err = validPromo(d, true);
  if (err) return res.status(400).json({ error: err });
  try { res.json(await Order.updatePromo(Number(req.params.id), d)); }
  catch (e) { if (e.code === 'P2002') return res.status(400).json({ error: 'Bunday kod allaqachon mavjud' }); throw e; }
});
const deletePromo = asyncH(async (req, res) => { await Order.deletePromo(Number(req.params.id)); res.json({ ok: true }); });

const getSettings = asyncH(async (req, res) => res.json(await Product.getSettings()));
const saveSettings = asyncH(async (req, res) => res.json(await Product.saveSettings(req.body || {})));

module.exports = {
  stats, customers, listAddons, createAddon, updateAddon, deleteAddon,
  listPromos, createPromo, updatePromo, deletePromo, getSettings, saveSettings,
  me, listOrders, getOrder, setStatus, getMenu,
  createCategory, updateCategory, deleteCategory,
  createProduct, updateProduct, deleteProduct,
};
