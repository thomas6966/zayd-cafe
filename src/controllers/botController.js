// Bot logikasi: /start, xabarlar, mijoz va adminlarga bildirishnomalar
const { Markup } = require('telegraf');
const bot = require('../core/bot');
const config = require('../config/default');
const User = require('../models/User');

const fmt = (n) => new Intl.NumberFormat('ru-RU').format(n) + " so'm";
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const PAY_LABEL = { CASH: 'Naqd', TERMINAL: 'Terminal (olganda)', ONLINE: "Onlayn karta (to'lov kutilmoqda)" };

const STATUS_TEXT = {
  NEW: '🆕 Buyurtmangiz qabul qilindi',
  PREPARING: '👨‍🍳 Buyurtmangiz tayyorlanmoqda',
  READY: '✅ Buyurtmangiz tayyor! Kafeda olib ketishingiz mumkin',
  DELIVERING: "🚚 Buyurtmangiz yo'lda",
  COMPLETED: '🎉 Buyurtma yakunlandi. Yoqimli ishtaha!',
  CANCELLED: '❌ Buyurtma bekor qilindi',
};

const openAppKeyboard = () => {
  if (!config.webAppUrl) return undefined;
  return Markup.inlineKeyboard([Markup.button.webApp('🍽 Buyurtma berish', config.webAppUrl)]);
};

async function onStart(ctx) {
  await User.upsertFromTelegram(ctx.from);
  const text = `Assalomu alaykum, ${esc(ctx.from.first_name)}! 👋\n\n<b>${config.cafeName}</b> ga xush kelibsiz.\nMenyuni ko'rish va buyurtma berish uchun pastdagi tugmani bosing.`;
  const kb = openAppKeyboard();
  if (!kb) return ctx.replyWithHTML(text + '\n\n⚠️ Mini App manzili hali sozlanmagan (WEBAPP_URL).');
  return ctx.replyWithHTML(text, kb);
}

async function onHelp(ctx) {
  return ctx.replyWithHTML(
    `<b>${config.cafeName}</b>\n\n/start — buyurtma berish\n/help — yordam\n\nBuyurtma holati o'zgarganda sizga shu yerda xabar keladi.`
  );
}

// Xabar yuborishda xato bo'lsa (masalan, foydalanuvchi botni bloklagan) — faqat log
async function safeSend(chatId, text, extra) {
  if (process.env.DISABLE_BOT) return;
  try {
    await bot.telegram.sendMessage(String(chatId), text, { parse_mode: 'HTML', ...extra });
  } catch (e) {
    console.error(`[bot] ${chatId} ga yuborib bo'lmadi:`, e.message);
  }
}

// Yangi buyurtma: mijozga tasdiq + adminlarga signal
async function notifyNewOrder(order) {
  await safeSend(order.user.telegramId, `${STATUS_TEXT.NEW}\n\n<b>Buyurtma #${order.id}</b>\nJami: <b>${fmt(order.total)}</b>`);

  const lines = order.items
    .map((i) => `• ${esc(i.name)} × ${i.quantity}${i.addons?.length ? ` + ${esc(i.addons.map((a) => a.name).join(', '))}` : ''}${i.note ? ` <i>(${esc(i.note)})</i>` : ''}`)
    .join('\n');
  const who = `${esc(order.user.firstName)}${order.user.username ? ` (@${esc(order.user.username)})` : ''}`;
  const where =
    order.deliveryType === 'DELIVERY' ? `🚚 Yetkazib berish: ${esc(order.address || 'lokatsiya')}` : '🏪 Kafeda olib ketish';
  const text = `🔔 <b>Yangi buyurtma #${order.id}</b>\n\n👤 ${who}\n📞 ${esc(order.phone)}\n${where}\n💳 ${
    PAY_LABEL[order.paymentMethod]
  }\n\n${lines}${order.discount > 0 ? `\n🏷 Promo ${esc(order.promoCode)}: −${fmt(order.discount)}` : ''}${
    order.deliveryFee > 0 ? `\n🚚 Yetkazish: ${fmt(order.deliveryFee)}` : ''
  }\n\n💰 <b>${fmt(order.total)}</b>${order.comment ? `\n💬 ${esc(order.comment)}` : ''}`;

  for (const id of config.adminIds) {
    await safeSend(id, text);
    if (order.latitude != null && order.longitude != null) {
      try {
        await bot.telegram.sendLocation(id, order.latitude, order.longitude);
      } catch {
        /* e'tiborsiz */
      }
    }
  }
}

// Mijoz "to'ladim" dedi: adminlarga tekshirish uchun xabar
async function notifyPaymentPending(order) {
  const text = `💳 <b>To'lovni tekshiring — buyurtma #${order.id}</b>

👤 ${esc(order.user.firstName)}
💰 Summa: <b>${fmt(order.total)}</b>

Payme/Click'da pul tushganini tekshirib, admin panelda tasdiqlang.`;
  for (const id of config.adminIds) await safeSend(id, text);
}

// To'lov tasdiqlandi: mijozga xabar
async function notifyPaymentConfirmed(order) {
  await safeSend(order.user.telegramId, `✅ To'lovingiz tasdiqlandi!
<b>Buyurtma #${order.id}</b> tayyorlanmoqda.`);
}

// Status o'zgarganda mijozga xabar
async function notifyStatus(order) {
  const text = STATUS_TEXT[order.status];
  if (text) await safeSend(order.user.telegramId, `${text}\n<b>Buyurtma #${order.id}</b>`);
}

module.exports = { onStart, onHelp, notifyNewOrder, notifyPaymentPending, notifyPaymentConfirmed, notifyStatus, fmt };
