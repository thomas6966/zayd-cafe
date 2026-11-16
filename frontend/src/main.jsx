import React from 'react';
import { createRoot } from 'react-dom/client';
import WebApp from '@twa-dev/sdk';
import './index.css';
import App from './App.jsx';
import AdminApp from './admin/AdminApp.jsx';
import { applyTheme, getTheme } from './lib/theme.js';

applyTheme(getTheme());

// Telegram'ga tayyorligimizni bildiramiz va to'liq ekranga ochamiz
try {
  WebApp.ready();
  WebApp.expand();
} catch { /* brauzerda e'tiborsiz */ }

// /admin yo'li — admin panel, qolgani — mijoz ilovasi
const isAdmin = window.location.pathname.startsWith('/admin');
if (isAdmin) document.body.classList.add('admin');

createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isAdmin ? <AdminApp /> : <App />}</React.StrictMode>
);
