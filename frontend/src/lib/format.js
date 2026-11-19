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

// Sana: oy nomisiz (har qanday qurilmada bir xil ishlaydi): 19.11 15:38
export const timeStr = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Til bo'yicha nom: o'zbekchada nameUz (bo'lsa), aks holda ruscha asosiy nom
export const loc = (item, lang) => (lang === 'uz' && item?.nameUz ? item.nameUz : item?.name);
