// Bot handlerlarini ro'yxatdan o'tkazadi
const bot = require('../core/bot');
const { onStart, onHelp } = require('../controllers/botController');

module.exports = function registerBotRoutes() {
  bot.start(onStart);
  bot.help(onHelp);
  bot.on('message', (ctx) => ctx.reply('Buyurtma berish uchun /start ni bosing 🍽'));
};
