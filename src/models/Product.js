const prisma = require('../database/connection');

// Mijozlar uchun: faqat faol kategoriyalar va mavjud mahsulotlar
const getPublicMenu = () =>
  prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: { products: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } } },
  });

// Admin uchun: hammasi
const getFullMenu = () =>
  prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { products: { orderBy: { sortOrder: 'asc' } } },
  });

const findByIds = (ids) => prisma.product.findMany({ where: { id: { in: ids } } });

const createCategory = (data) => prisma.category.create({ data });
const updateCategory = (id, data) => prisma.category.update({ where: { id }, data });
const deleteCategory = (id) => prisma.category.delete({ where: { id } });

const createProduct = (data) => prisma.product.create({ data });
const updateProduct = (id, data) => prisma.product.update({ where: { id }, data });
const deleteProduct = (id) => prisma.product.delete({ where: { id } });

module.exports = {
  getPublicMenu, getFullMenu, findByIds,
  createCategory, updateCategory, deleteCategory,
  createProduct, updateProduct, deleteProduct,
};

// ---------- Qo'shimchalar ----------
const listAddons = (onlyActive = false) =>
  prisma.addon.findMany({ where: onlyActive ? { isActive: true } : undefined, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
const createAddon = (data) => prisma.addon.create({ data });
const updateAddon = (id, data) => prisma.addon.update({ where: { id }, data });
const deleteAddon = (id) => prisma.addon.delete({ where: { id } });

// ---------- Sozlamalar (key/value) ----------
const DEFAULT_SETTINGS = { deliveryFee: 0, freeDeliveryFrom: 0, minOrder: 0, cardNumber: '', cardHolder: '' };
const TEXT_KEYS = ['cardNumber', 'cardHolder'];
async function getSettings() {
  const rows = await prisma.setting.findMany();
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in out) out[r.key] = TEXT_KEYS.includes(r.key) ? r.value : Number(r.value) || 0;
  return out;
}
async function saveSettings(input) {
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (input[key] === undefined) continue;
    const value = TEXT_KEYS.includes(key)
      ? String(input[key] ?? '').trim().slice(0, 60)
      : String(Math.max(0, Math.round(Number(input[key]) || 0)));
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  return getSettings();
}

Object.assign(module.exports, { listAddons, createAddon, updateAddon, deleteAddon, getSettings, saveSettings });
