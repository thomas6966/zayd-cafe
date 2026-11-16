const prisma = require('../database/connection');

// Telegram ma'lumotlari bo'yicha foydalanuvchini yaratadi yoki yangilaydi
const upsertFromTelegram = (tg) =>
  prisma.user.upsert({
    where: { telegramId: BigInt(tg.id) },
    update: { firstName: tg.first_name || 'Mijoz', lastName: tg.last_name || null, username: tg.username || null },
    create: { telegramId: BigInt(tg.id), firstName: tg.first_name || 'Mijoz', lastName: tg.last_name || null, username: tg.username || null },
  });

const setPhone = (id, phone) => prisma.user.update({ where: { id }, data: { phone } });

module.exports = { upsertFromTelegram, setPhone };

// Admin uchun mijozlar ro'yxati: buyurtmalar soni va sarflangan summa
async function listCustomers() {
  const prisma2 = prisma;
  const users = await prisma2.user.findMany({ orderBy: { createdAt: 'desc' }, include: { orders: { select: { total: true, status: true } } } });
  return users.map(({ orders, ...u }) => {
    const done = orders.filter((o) => o.status !== 'CANCELLED');
    return { ...u, ordersCount: done.length, spent: done.reduce((s, o) => s + o.total, 0) };
  });
}
module.exports.listCustomers = listCustomers;
