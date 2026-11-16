// Butun mijoz ilovasi holati (zustand). Savat, sevimlilar va til localStorage'da saqlanadi.
import { create } from 'zustand';
import { api } from './api.js';
import { tgUser } from './tg.js';

const LS = 'zayd_state_v2';
const read = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
const saved = read();

const defaultLang = () => (tgUser()?.language_code === 'ru' ? 'ru' : 'uz');
export const lineKey = (productId, note, addonIds = []) => `${productId}::${note || ''}::${[...addonIds].sort().join(',')}`;

export const useStore = create((set, get) => ({
  // saqlanadigan
  lang: saved.lang || defaultLang(),
  cart: saved.cart || [], // [{key, productId, quantity, note}]
  favorites: saved.favorites || [],
  phone: saved.phone || '',

  // vaqtinchalik
  menu: null,
  config: { addons: [], settings: { deliveryFee: 0, freeDeliveryFrom: 0, minOrder: 0 } },
  bootState: 'loading', // loading | ready | error
  tab: 'menu',
  cartOpen: false,
  orders: [],
  placed: null, // muvaffaqiyatli buyurtma
  toast: null,

  boot: async () => {
    set({ bootState: 'loading' });
    try {
      const [menu, config] = await Promise.all([api.get('/api/menu'), api.get('/api/config').catch(() => null)]);
      // Savatdagi, endi mavjud bo'lmagan mahsulotlarni olib tashlaymiz
      const ids = new Set(menu.flatMap((c) => c.products.map((p) => p.id)));
      set({ menu, ...(config ? { config } : {}), bootState: 'ready', cart: get().cart.filter((l) => ids.has(l.productId)) });
    } catch {
      set({ bootState: 'error' });
    }
  },

  setLang: (lang) => set({ lang }),
  setTab: (tab) => set({ tab }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
  setPhone: (phone) => set({ phone }),
  showToast: (toast) => { set({ toast }); setTimeout(() => get().toast === toast && set({ toast: null }), 1800); },

  addToCart: (productId, quantity = 1, note = '', addonIds = []) =>
    set((s) => {
      const key = lineKey(productId, note, addonIds);
      const found = s.cart.find((l) => l.key === key);
      return {
        cart: found
          ? s.cart.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + quantity) } : l))
          : [...s.cart, { key, productId, quantity, note, addonIds }],
      };
    }),
  setQty: (key, n) => set((s) => ({ cart: n <= 0 ? s.cart.filter((l) => l.key !== key) : s.cart.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, n) } : l)) })),
  clearCart: () => set({ cart: [] }),

  toggleFavorite: (id) => set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id] })),

  refreshOrders: async () => {
    try { set({ orders: await api.get('/api/orders/my') }); } catch { /* keyingi safar */ }
  },
  setPlaced: (placed) => set({ placed }),
}));

// Saqlash
useStore.subscribe((s) => {
  try { localStorage.setItem(LS, JSON.stringify({ lang: s.lang, cart: s.cart, favorites: s.favorites, phone: s.phone })); } catch { /* ignore */ }
});

// Yordamchilar
export const productMap = (menu) => {
  const m = new Map();
  menu?.forEach((c) => c.products.forEach((p) => m.set(p.id, { ...p, category: c })));
  return m;
};

// Qatorning bitta dona narxi: mahsulot + shu kategoriyaga tegishli tanlangan qo'shimchalar
export const lineAddons = (line, product, addons) =>
  (line.addonIds || []).map((id) => addons.find((a) => a.id === id)).filter((a) => a && product && a.categoryIds.includes(product.category.id));
export const unitPrice = (line, product, addons) =>
  product ? product.price + lineAddons(line, product, addons).reduce((s, a) => s + a.price, 0) : 0;
