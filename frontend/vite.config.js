import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// /api so'rovlari backend (localhost:3000) ga yo'naltiriladi.
// Shu sababli ngrok faqat bitta portni (5173) ochishi kifoya.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true, // ngrok domenlariga ruxsat
    proxy: { '/api': 'http://localhost:3000' },
  },
});
