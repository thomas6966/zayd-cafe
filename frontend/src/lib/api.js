// Backend bilan aloqa. Telegram initData har so'rovda yuboriladi.
import WebApp from '@twa-dev/sdk';

const inTelegram = !!WebApp.initData;

// Backend manzili: Vercel'da VITE_API_URL (Render), lokalda bo'sh (Vite proxy ishlatiladi)
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const getInitData = () => (inTelegram ? WebApp.initData : 'dev'); // 'dev' — faqat development brauzer rejimi

const ADMIN_PIN_KEY = 'zayd_admin_pin';
export const adminPin = {
  get: () => { try { return sessionStorage.getItem(ADMIN_PIN_KEY) || ''; } catch { return ''; } },
  set: (v) => { try { sessionStorage.setItem(ADMIN_PIN_KEY, v); } catch { /* ignore */ } },
  clear: () => { try { sessionStorage.removeItem(ADMIN_PIN_KEY); } catch { /* ignore */ } },
};

async function request(method, url, body) {
  let res;
  try {
    res = await fetch(API_BASE + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-init-data': getInitData(),
        ...(adminPin.get() ? { 'x-admin-pin': adminPin.get() } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Serverga ulanib bo'lmadi. Internetni tekshiring.");
  }
  let data = null;
  try { data = await res.json(); } catch { /* bo'sh javob */ }
  if (!res.ok) {
    const err = new Error(data?.error || `Xatolik (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b || {}),
  put: (u, b) => request('PUT', u, b || {}),
  patch: (u, b) => request('PATCH', u, b || {}),
  del: (u) => request('DELETE', u),
};
