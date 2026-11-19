// Reel uchun ilova ekranlarini oladi (soxta ma'lumot bilan; haqiqiy buyurtma/karta ishlatilmaydi)
import puppeteer from 'puppeteer-core';
import { spawn, execSync } from 'child_process';
import fs from 'fs';

const CH = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);
const API = 'https://zayd-cafe-api.onrender.com';
import { fileURLToPath } from 'url';
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Frontend'ni API manzili bilan build qilib, preview'da ko'tarish
execSync('npx vite build', { cwd: 'c:/ZAYD Cafe/frontend', stdio: 'ignore', env: { ...process.env, VITE_API_URL: API } });
const prev = spawn('cmd', ['/c', 'npx vite preview --port 4173'], { cwd: 'c:/ZAYD Cafe/frontend', stdio: 'ignore' });
await sleep(4000);

const menu = await (await fetch(API + '/api/menu')).json();
const cfg = await (await fetch(API + '/api/config')).json();
cfg.settings.cardNumber = '8600123456789012';
cfg.settings.cardHolder = 'ZAYD CAFE';
const cappu = menu.flatMap((c) => c.products).find((p) => p.name === 'Капучино');
const marg = menu.flatMap((c) => c.products).find((p) => p.name === 'Маргарита');
const total = cappu.price + marg.price;
const mkOrder = (over = {}) => ({
  id: 27, total, status: 'NEW', paymentMethod: 'ONLINE', paymentStatus: 'UNPAID', deliveryType: 'PICKUP', createdAt: new Date().toISOString(),
  items: [
    { id: 1, productId: cappu.id, name: cappu.name, price: cappu.price, quantity: 1, note: 'Shakar 50%' },
    { id: 2, productId: marg.id, name: marg.name, price: marg.price, quantity: 1, note: null },
  ], ...over,
});
let ordersMy = [];

const b = await puppeteer.launch({ executablePath: CH, headless: 'new' });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await p.setRequestInterception(true);
const json = (r, body, status = 200) => r.respond({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, body: JSON.stringify(body) });
p.on('request', (r) => {
  const u = r.url();
  if (!u.startsWith(API)) return r.continue();
  if (r.method() === 'OPTIONS') return r.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
  if (u.endsWith('/api/menu')) return json(r, menu);
  if (u.endsWith('/api/config')) return json(r, cfg);
  if (u.endsWith('/api/orders/my')) return json(r, ordersMy);
  if (u.endsWith('/api/quote')) return json(r, { subtotal: total, discount: 0, deliveryFee: 0, total, promo: null, promoError: null });
  if (u.endsWith('/api/orders') && r.method() === 'POST') return json(r, mkOrder(), 201);
  if (u.includes('/paid')) return json(r, mkOrder({ paymentStatus: 'PENDING' }));
  return r.continue();
});
await p.evaluateOnNewDocument(() => { localStorage.setItem('zayd_theme', 'dark'); localStorage.setItem('zayd_state_v2', JSON.stringify({ lang: 'uz', cart: [], favorites: [], phone: '' })); });
const shot = (name) => p.screenshot({ path: OUT + name + '.png' });
const rects = {};
// Elementning (matn bo'yicha) joyini saqlaydi: video animatsiyasida barmoq bosishi uchun
const rect = (key, text, sel = 'button') => p.evaluate(([t, s]) => {
  const el = [...document.querySelectorAll(s)].find((x) => x.textContent.includes(t));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
}, [text, sel]).then((r) => { rects[key] = r; });
const click = (text, sel = 'button') => p.evaluate(([t, s]) => { [...document.querySelectorAll(s)].find((x) => x.textContent.includes(t))?.click(); }, [text, sel]);

await p.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
await sleep(700); await shot('splash');
await sleep(2200);
await shot('menu');
await rect('menu.kapuchino', 'Kapuchino', 'article');

// Kapuchino: oyna
await p.evaluate(() => { [...document.querySelectorAll('article')].find((a) => a.textContent.includes('Kapuchino'))?.click(); });
await sleep(900); await shot('modal');
await rect('modal.add', 'Savatga');
await click('Savatga'); await sleep(700);
// Margarita: oyna ochmasdan ham bo'ladi, lekin oyna orqali qo'shamiz
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'minus'); });
await p.evaluate(() => { window.scrollTo(0, 0); });
await p.evaluate(() => { [...document.querySelectorAll('article')].find((a) => a.textContent.includes('Margarita'))?.click(); });
await sleep(900); await click('Savatga'); await sleep(800);
await p.evaluate(() => { document.getElementById('cat-' + [...document.querySelectorAll('[data-cat]')][0].dataset.cat)?.scrollIntoView(); });
await sleep(500); await shot('menu-cartbar');
await rect('menu.cartbar', 'Savatni');

await click('Savatni'); await sleep(1000); await shot('cart-top');
await p.evaluate(() => { const sc = [...document.querySelectorAll('div')].find((d) => getComputedStyle(d).overflowY === 'auto' && d.scrollHeight > d.clientHeight + 40); sc?.scrollTo(0, 100000); });
await sleep(600);
await p.type('input[type=tel]', '901234567').catch(() => {});
await sleep(300); await shot('cart-bottom');
await rect('cart.place', "To'lovga o'tish");

await click("To'lovga o'tish"); await sleep(2500); await shot('pay');
await rect('pay.copy', 'Nusxalash');
await rect('pay.paid', "To'ladim");
await p.evaluate(() => { const el = [...document.querySelectorAll('p')].find((x) => /\d{4} \d{4}/.test(x.textContent)); window.__r = el?.getBoundingClientRect(); });
rects['pay.card'] = await p.evaluate(() => (window.__r ? { x: window.__r.x, y: window.__r.y, w: window.__r.width, h: window.__r.height } : null));
await click("To'ladim"); await sleep(1500); await shot('pay-pending');

// Buyurtmalar bo'limi: tayyorlanmoqda
ordersMy = [mkOrder({ paymentStatus: 'PAID', status: 'PREPARING' })];
await click('Buyurtmani kuzatish'); await sleep(1800); await shot('orders');

fs.writeFileSync(OUT + 'rects.json', JSON.stringify(rects, null, 1));
await b.close();
try { execSync('powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 4173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }"'); } catch { /* ignore */ }
try { fs.rmSync('c:/ZAYD Cafe/frontend/dist', { recursive: true, force: true }); } catch { /* ignore */ }
console.log('shots:', fs.readdirSync(OUT).join(', '));
