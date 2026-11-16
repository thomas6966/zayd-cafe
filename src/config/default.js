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
  // Render'da RENDER_EXTERNAL_URL avtomatik beriladi -> bot webhook rejimida ishlaydi
  publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, ''),
  // Faqat shu frontend'dan keladigan so'rovlarga ruxsat (bo'sh bo'lsa hammasiga)
  frontendUrl: (process.env.FRONTEND_URL || '').replace(/\/+$/, ''),
  cafeName: 'ZAYD Cafe',
};
