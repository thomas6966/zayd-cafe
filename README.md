# ZAYD Cafe — Telegram Mini App

Halol kafe uchun buyurtma tizimi: mijozlar uchun Telegram Mini App, admin panel va bot.

**Stack:** Node.js + Express + Prisma (PostgreSQL / Neon) + Telegraf · React + Vite + Tailwind + Framer Motion

## Imkoniyatlar
- Menyu, qidiruv, sevimlilar, qo'shimchalar, savat, promo-kod
- Olib ketish / yetkazish, naqd / terminal
- Buyurtma holatini kuzatish va Telegram orqali xabarlar
- Admin panel: buyurtmalar, statistika, menyu, qo'shimchalar, promo-kodlar, mijozlar, sozlamalar
- Kunduzgi / tungi rejim, UZ / RU

## Ishga tushirish
```bash
npm install
cd frontend && npm install && cd ..
cp .env.example .env        # qiymatlarni to'ldiring
npm run db:setup            # jadvallar + menyu seed
npm run dev                 # backend + bot (3000)
cd frontend && npm run dev  # Mini App (5173)
```
Telegram ichida ochish uchun frontend'ni tunnel orqali (`cloudflared tunnel --url http://localhost:5173` yoki `ngrok http 5173`) internetga chiqarib, olingan HTTPS manzilni `.env` dagi `WEBAPP_URL` ga yozing.
Windows'da hammasini bittada: `start.bat`.

Admin panel: `/admin` (Telegram ID `ADMIN_IDS` ro'yxatida bo'lsa to'g'ridan-to'g'ri, aks holda `ADMIN_PIN`).

> `.env` hech qachon repoga qo'shilmaydi.
