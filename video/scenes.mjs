// Reel ssenariysi: har sahna uchun ovoz matni, sarlavha va ekran
// (TTS o'qishi uchun matn lotin yozuvida, tinish belgilar bilan)
export const VOICE = 'uz-UZ-MadinaNeural'; // erkak ovoz uchun: 'uz-UZ-SardorNeural'

export const scenes = [
  {
    id: 's0',
    voice: "Zayd Cafe'dan telefon orqali buyurtma berish juda oson! Keling, hammasini qadam-baqadam ko'rib chiqamiz.",
    badge: 'QO\'LLANMA',
    title: 'Onlayn buyurtma',
    sub: 'Zayd Cafe · 5 ta oddiy qadamda',
  },
  {
    id: 's1',
    voice: "Birinchi qadam. Telegramda Zayd Cafe botini oching va, Buyurtma berish, tugmasini bosing.",
    badge: '1-QADAM',
    title: 'Botni oching',
    sub: '«Buyurtma berish» tugmasini bosing',
  },
  {
    id: 's2',
    voice: "Ikkinchi qadam. Menyudan yoqqan taomingizni tanlang. Ichimlik bo'lsa, shakar miqdorini belgilang va, Savatga, tugmasini bosing.",
    badge: '2-QADAM',
    title: 'Taomni tanlang',
    sub: 'Savatga qo‘shing',
  },
  {
    id: 's3',
    voice: "Pastdagi savat tugmasini bosing. Olib ketish yoki yetkazib berishni tanlang, telefon raqamingizni yozing va, To'lovga o'tish, tugmasini bosing.",
    badge: 'SAVAT',
    title: 'Savatni oching',
    sub: 'Telefon raqamingizni yozing',
  },
  {
    id: 's4',
    voice: "Uchinchi qadam, to'lov. Avval, Nusxalash, tugmasi bilan karta raqamini nusxalab oling.",
    badge: '3-QADAM',
    title: 'Karta raqamini nusxalang',
    sub: '«Nusxalash» tugmasini bosing',
  },
  {
    id: 's5',
    voice: "Endi Payme yoki Click ilovasini oching. Kartaga o'tkazma bo'limiga kiring, karta raqamini joylashtiring va ekranda ko'rsatilgan summani aynan shunday yuboring.",
    badge: 'PAYME / CLICK',
    title: 'Ilovada to‘lov qiling',
    sub: 'Kartaga o‘tkazma · raqamni joylashtiring',
  },
  {
    id: 's6',
    voice: "To'lov o'tgach, Telegramdagi botga qaytib, To'ladim, tugmasini bosing.",
    badge: '4-QADAM',
    title: '«To‘ladim» ni bosing',
    sub: 'Botga qaytib, bu juda muhim!',
  },
  {
    id: 's7',
    voice: "Biz to'lovni tekshiramiz va buyurtmangiz tayyorlanadi. Telegramga xabar keladi. Buyurtma holatini, Buyurtmalar, bo'limida kuzatib boring.",
    badge: '5-QADAM',
    title: 'Buyurtmani kuzating',
    sub: 'Tayyor bo‘lganda xabar keladi',
  },
  {
    id: 's8',
    voice: "Mana shunchalik oson! Yoqimli ishtaha!",
    badge: 'ZAYD CAFE',
    title: 'Yoqimli ishtaha!',
    sub: '@zaydcafe_bot',
  },
];
