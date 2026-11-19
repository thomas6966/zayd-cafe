const prisma = require('../database/connection');

const include = { items: true, user: true };

const create = (data) => prisma.order.create({ data, include });
const findById = (id) => prisma.order.findUnique({ where: { id }, include });
const findByUser = (userId) =>
  prisma.order.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30, include: { items: true } });

const list = (status) =>
  prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include,
  });

const setPayment = (id, paymentStatus) => prisma.order.update({ where: { id }, data: { paymentStatus }, include });
const updateStatus = (id, status) => prisma.order.update({ where: { id }, data: { status }, include });

// Status bo'yicha buyurtmalar soni (admin paneldagi badge'lar uchun)
const countByStatus = async () => {
  const rows = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]));
};

module.exports = { setPayment, create, findById, findByUser, list, updateStatus, countByStatus };

// ---------- Promo-kodlar ----------
const listPromos = () => prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
const findPromo = (code) => prisma.promoCode.findUnique({ where: { code: String(code).trim().toUpperCase() } });
const createPromo = (data) => prisma.promoCode.create({ data });
const updatePromo = (id, data) => prisma.promoCode.update({ where: { id }, data });
const deletePromo = (id) => prisma.promoCode.delete({ where: { id } });
const usePromo = (code) => prisma.promoCode.update({ where: { code }, data: { usedCount: { increment: 1 } } });

// ---------- Statistika (Toshkent vaqti, UTC+5) ----------
const TZ_MS = 5 * 3600 * 1000;
const dayKey = (d) => new Date(new Date(d).getTime() + TZ_MS).toISOString().slice(0, 10);

// Onlayn buyurtma tushumga faqat to'lov tasdiqlangach kiradi
const PAID_OR_OFFLINE = [{ paymentMethod: { not: 'ONLINE' } }, { paymentStatus: 'PAID' }];

async function getStats() {
  const now = Date.now();
  const todayStr = dayKey(now);
  // Oxirgi 7 kun boshlanishi (Toshkent yarim kechasi, UTC da)
  const startToday = new Date(todayStr + 'T00:00:00.000Z').getTime() - TZ_MS;
  const since = new Date(startToday - 6 * 86400000);

  const [orders, customers, active] = await Promise.all([
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { not: 'CANCELLED' }, OR: PAID_OR_OFFLINE }, select: { id: true, total: true, createdAt: true } }),
    prisma.user.count(),
    prisma.order.count({ where: { status: { in: ['NEW', 'PREPARING', 'READY', 'DELIVERING'] } } }),
  ]);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayKey(startToday + TZ_MS - i * 86400000);
    days.push({ date, orders: 0, revenue: 0 });
  }
  for (const o of orders) {
    const d = days.find((x) => x.date === dayKey(o.createdAt));
    if (d) { d.orders += 1; d.revenue += o.total; }
  }
  const today = days[days.length - 1];
  const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const weekOrders = days.reduce((s, d) => s + d.orders, 0);

  const top = await prisma.orderItem.groupBy({
    by: ['name'], _sum: { quantity: true },
    where: { order: { createdAt: { gte: since }, status: { not: 'CANCELLED' }, OR: PAID_OR_OFFLINE } },
    orderBy: { _sum: { quantity: 'desc' } }, take: 6,
  });

  return {
    todayOrders: today.orders, todayRevenue: today.revenue, activeOrders: active, customers,
    weekRevenue, weekOrders, avgOrder: weekOrders ? Math.round(weekRevenue / weekOrders) : 0,
    days, top: top.map((t) => ({ name: t.name, quantity: t._sum.quantity })),
  };
}

Object.assign(module.exports, { listPromos, findPromo, createPromo, updatePromo, deletePromo, usePromo, getStats });
