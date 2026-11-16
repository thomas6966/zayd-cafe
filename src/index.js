// Asosiy ishga tushirish fayli: Express API + Telegram bot
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const config = require('./config/default');
const prisma = require('./database/connection');
const bot = require('./core/bot');
const registerBotRoutes = require('./routes/bot.routes');

// BigInt (telegramId) ni JSON'ga o'tkazish
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();
app.use(cors(config.frontendUrl ? { origin: config.frontendUrl } : undefined));
app.use(express.json({ limit: '100kb' }));

// Webhook (faqat server rejimida): yo'l va maxfiy kalit bot tokenidan hosil qilinadi
const hookSecret = crypto.createHash('sha256').update(config.botToken).digest('hex').slice(0, 32);
const hookPath = `/telegram/${hookSecret}`;
if (config.publicUrl) app.use(bot.webhookCallback(hookPath, { secretToken: hookSecret }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', require('./routes/client.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Topilmadi' }));

// Markaziy xato handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[api]', err);
  const notFound = err.code === 'P2025';
  res.status(notFound ? 404 : 500).json({ error: notFound ? 'Yozuv topilmadi' : 'Serverda xatolik yuz berdi' });
});

async function main() {
  await prisma.$connect();
  console.log("✔ Ma'lumotlar bazasiga ulandi");

  app.listen(config.port, () => console.log(`✔ API: http://localhost:${config.port}`));

  registerBotRoutes();
  const me = await bot.telegram.getMe();
  if (config.publicUrl) {
    // Server (Render): webhook — Telegram xabari uxlab yotgan xizmatni uyg'otadi
    await bot.telegram.setWebhook(config.publicUrl + hookPath, { secret_token: hookSecret, drop_pending_updates: true });
    console.log("✔ Webhook o'rnatildi");
  } else {
    // Lokal: long polling
    bot.launch({ dropPendingUpdates: true }).catch((e) => console.error('[bot]', e.message));
  }
  console.log(`✔ Bot ishga tushdi: @${me.username}`);

  if (config.webAppUrl) {
    await bot.telegram
      .setChatMenuButton({ menuButton: { type: 'web_app', text: 'Menyu', web_app: { url: config.webAppUrl } } })
      .catch((e) => console.error('[bot] menu button:', e.message));
    console.log(`✔ Mini App: ${config.webAppUrl}`);
  } else {
    console.log("ℹ WEBAPP_URL bo'sh — ngrok ishga tushgach .env ga yozing");
  }
}

main().catch((e) => {
  console.error('Ishga tushmadi:', e);
  process.exit(1);
});

const stop = (sig) => {
  if (!config.publicUrl) bot.stop(sig);
  prisma.$disconnect().finally(() => process.exit(0));
};
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
