export const money = (n) => new Intl.NumberFormat('ru-RU').format(n || 0);
export const moneySum = (n) => money(n) + " so'm";

// Admin panel uchun status ranglari
export const STATUS = {
  NEW: { label: 'Qabul qilindi', color: 'bg-blue-500', emoji: '🆕' },
  PREPARING: { label: 'Tayyorlanmoqda', color: 'bg-amber-500', emoji: '👨‍🍳' },
  READY: { label: 'Tayyor', color: 'bg-emerald-500', emoji: '✅' },
  DELIVERING: { label: "Yo'lda", color: 'bg-violet-500', emoji: '🚚' },
  COMPLETED: { label: 'Yakunlandi', color: 'bg-gray-500', emoji: '🎉' },
  CANCELLED: { label: 'Bekor qilindi', color: 'bg-red-500', emoji: '❌' },
};

export const timeStr = (iso, locale = 'uz-UZ') =>
  new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Til bo'yicha nom: o'zbekchada nameUz (bo'lsa), aks holda ruscha asosiy nom
export const loc = (item, lang) => (lang === 'uz' && item?.nameUz ? item.nameUz : item?.name);
