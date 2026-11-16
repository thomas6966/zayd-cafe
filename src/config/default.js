// Barcha sozlamalar va muhit o'zgaruvchilari shu yerda
require('dotenv').config();

const required = (name) => {
  const v = process.env[name];
  if (!v) throw new Error(`.env faylida ${name} ko'rsatilmagan`);
  return v;
};

module.exports = {
  port: Number(process.env.PORT) || 3000,
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  botToken: required('BOT_TOKEN'),
  adminIds: (process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean),
  adminPin: process.env.ADMIN_PIN || '',
  webAppUrl: (process.env.WEBAPP_URL || '').replace(/\/$/, ''),
  cafeName: 'ZAYD Cafe',
};
