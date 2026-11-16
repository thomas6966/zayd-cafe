// Tungi / kunduzgi rejim. Tanlov localStorage'da saqlanadi.
import { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const KEY = 'zayd_theme';
const listeners = new Set();

export function getTheme() {
  try {
    const s = localStorage.getItem(KEY);
    if (s === 'light' || s === 'dark') return s;
  } catch { /* ignore */ }
  // Telegram ichida — Telegram mavzusi, aks holda tizim mavzusi
  if (WebApp.initData && (WebApp.colorScheme === 'light' || WebApp.colorScheme === 'dark')) return WebApp.colorScheme;
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const bg = theme === 'light' ? '#f4f1e3' : '#0e150f';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  try { WebApp.setHeaderColor(bg); WebApp.setBackgroundColor(bg); } catch { /* brauzerda e'tiborsiz */ }
}

export function setTheme(theme) {
  try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  applyTheme(theme);
  listeners.forEach((l) => l(theme));
}

export function useTheme() {
  const [theme, set] = useState(() => document.documentElement.dataset.theme || getTheme());
  useEffect(() => { listeners.add(set); return () => listeners.delete(set); }, []);
  return [theme, () => setTheme(theme === 'light' ? 'dark' : 'light')];
}
