// Menyuni bazaga yozish (qayta ishga tushirsa ham xavfsiz — mavjud bo'lsa o'tkazib yuboradi)
const { PrismaClient } = require('@prisma/client');
const images = require('./images.json'); // taom nomi -> /menu/xxx.webp
const translations = require('./translations.json'); // ruscha nom -> o'zbekcha nom
const prisma = new PrismaClient();

const MENU = [
  { name: 'Кофе', emoji: '☕', items: [
    ['Эспрессо', 15000], ['Американо', 20000], ['Дабл эспрессо', 30000], ['Капучино', 35000],
    ['Латте', 35000], ['Флэт вайт', 45000], ['Раф', 50000] ] },
  { name: 'Чай', emoji: '🍵', items: [
    ['Черный чай', 7000], ['Зеленый чай', 7000], ['Черный с лимоном', 15000], ['Зеленый с лимоном', 15000],
    ['Ягодный чай', 35000], ['Манго-маракуйя', 40000], ['Чай с облепихой', 45000], ['Ташкентский чай', 45000] ] },
  { name: 'Пицца', emoji: '🍕', items: [
    ['Пеперони', 80000], ['Мясо и грибы BBQ', 85000], ['Мясо с овощами', 85000], ['Маргарита', 75000] ] },
  { name: 'Бургеры', emoji: '🍔', items: [
    ['Классик смаш бургер', 55000], ['Смаш халапеньо', 55000], ['Смаш с грибами', 60000], ['Смаш онион', 55000] ] },
  { name: 'Сендвич-пицца', emoji: '🥪', items: [
    ['Chicken сендвич', 50000], ['Beef сендвич', 65000], ['BBQ beef сендвич', 55000] ] },
  { name: 'Клаб сендвич', emoji: '🥙', items: [['Клаб сендвич', 50000]] },
  { name: 'Соусы', emoji: '🥫', items: [
    ['Кетчуп', 5000], ['Майонез', 5000], ['Сырный', 5000], ['Чесночный', 5000] ] },
  { name: 'Дополнительно', emoji: '🍟', items: [['Фри', 20000], ['Стрипсы', 25000]] },
];

// Rasmi yo'q mahsulotlarga rasm biriktiradi
async function applyImages() {
  for (const [name, url] of Object.entries(images)) {
    await prisma.product.updateMany({ where: { name, imageUrl: null }, data: { imageUrl: url } });
  }
  console.log('Rasmlar biriktirildi.');
}

// Namuna qo'shimchalar va promo-kod (admin paneldan o'zgartirish mumkin)
async function seedExtras() {
  if ((await prisma.addon.count()) > 0) return;
  const cats = await prisma.category.findMany();
  const id = (name) => cats.find((c) => c.name === name)?.id;
  const ids = (...names) => names.map(id).filter(Boolean);
  await prisma.addon.createMany({
    data: [
      { name: "Qo'shimcha shot", nameRu: 'Доп. шот', price: 10000, categoryIds: ids('Кофе'), sortOrder: 1 },
      { name: 'Sirop', nameRu: 'Сироп', price: 8000, categoryIds: ids('Кофе'), sortOrder: 2 },
      { name: "Qo'shimcha pishloq", nameRu: 'Доп. сыр', price: 10000, categoryIds: ids('Пицца', 'Бургеры', 'Сендвич-пицца', 'Клаб сендвич'), sortOrder: 3 },
      { name: 'Bekon', nameRu: 'Бекон', price: 12000, categoryIds: ids('Бургеры', 'Клаб сендвич'), sortOrder: 4 },
      { name: 'Limon', nameRu: 'Лимон', price: 3000, categoryIds: ids('Чай'), sortOrder: 5 },
    ],
  });
  if ((await prisma.promoCode.count()) === 0) {
    await prisma.promoCode.create({ data: { code: 'ZAYD10', type: 'PERCENT', value: 10, minOrder: 50000 } });
  }
  console.log("Namuna qo'shimchalar va ZAYD10 promo-kodi yozildi.");
}

// O'zbekcha nomi yo'q kategoriya va mahsulotlarga tarjima biriktiradi
async function applyTranslations() {
  for (const [name, nameUz] of Object.entries(translations.categories)) {
    await prisma.category.updateMany({ where: { name, nameUz: null }, data: { nameUz } });
  }
  for (const [name, nameUz] of Object.entries(translations.products)) {
    await prisma.product.updateMany({ where: { name, nameUz: null }, data: { nameUz } });
  }
  console.log("O'zbekcha nomlar biriktirildi.");
}

async function main() {
  if ((await prisma.category.count()) > 0) {
    console.log('Menyu allaqachon mavjud.');
    await applyImages();
    await applyTranslations();
    return seedExtras();
  }
  for (let i = 0; i < MENU.length; i++) {
    const c = MENU[i];
    await prisma.category.create({
      data: {
        name: c.name, emoji: c.emoji, sortOrder: i,
        products: { create: c.items.map(([name, price], j) => ({ name, price, sortOrder: j })) },
      },
    });
  }
  console.log('Menyu muvaffaqiyatli yozildi.');
  await applyImages();
  await applyTranslations();
  await seedExtras();
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
