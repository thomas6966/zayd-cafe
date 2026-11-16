// Telegram initData validatsiyasi va admin tekshiruvi
const crypto = require('crypto');
const config = require('../config/default');
const User = require('../models/User');

const MAX_AGE_SEC = 24 * 60 * 60;

// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function parseInitData(initData) {
  if (!initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  const age = Math.floor(Date.now() / 1000) - Number(params.get('auth_date') || 0);
  if (age > MAX_AGE_SEC) return null;
  try { return JSON.parse(params.get('user')); } catch { return null; }
}

// Telegram foydalanuvchisini aniqlaydi (req.tgUser)
function getTgUser(req) {
  const tg = parseInitData(req.get('x-init-data'));
  if (tg) return tg;
  // Faqat development: brauzerda Telegram'siz sinash uchun
  if (config.isDev && req.get('x-init-data') === 'dev') {
    return { id: 111111111, first_name: 'Test', username: 'test_user' };
  }
  return null;
}

async function requireUser(req, res, next) {
  try {
    const tg = getTgUser(req);
    if (!tg) return res.status(401).json({ error: 'Telegram orqali kiring (autentifikatsiya xatosi)' });
    req.tgUser = tg;
    req.user = await User.upsertFromTelegram(tg);
    next();
  } catch (e) { next(e); }
}

// Admin: Telegram ID whitelist YOKI brauzer uchun PIN
function requireAdmin(req, res, next) {
  const pin = req.get('x-admin-pin');
  if (pin && config.adminPin && pin === config.adminPin) return next();
  const tg = parseInitData(req.get('x-init-data'));
  if (tg && config.adminIds.includes(String(tg.id))) return next();
  return res.status(403).json({ error: 'Admin huquqi yo\'q' });
}

const isAdminTg = (id) => config.adminIds.includes(String(id));

module.exports = { requireUser, requireAdmin, isAdminTg, parseInitData };
