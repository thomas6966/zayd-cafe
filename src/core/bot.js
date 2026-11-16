// Telegraf bot instansiyasi
const { Telegraf } = require('telegraf');
const config = require('../config/default');

const bot = new Telegraf(config.botToken);

// Handlerlardagi kutilmagan xatolar serverni to'xtatib qo'ymasligi uchun
bot.catch((err, ctx) => {
  console.error(`[bot] ${ctx.updateType} xatosi:`, err.message);
});

module.exports = bot;
