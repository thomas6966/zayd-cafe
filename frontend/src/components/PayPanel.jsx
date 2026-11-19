// Onlayn to'lov paneli: karta raqami, summa, Payme/Click tugmalari va "To'ladim"
import { useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { api } from '../lib/api.js';
import { useT } from '../lib/i18n.js';
import { haptic } from '../lib/tg.js';
import { money } from '../lib/format.js';
import { useStore } from '../lib/store.js';

const fmtCard = (n) => String(n || '').replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();

function open(url) {
  try { WebApp.openLink(url); } catch { window.open(url, '_blank'); }
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    // Eski brauzerlar uchun zaxira usul
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch { /* ignore */ }
    ta.remove(); return ok;
  }
}

export default function PayPanel({ order, onChange }) {
  const { t } = useT();
  const { cardNumber, cardHolder } = useStore((s) => s.config.settings);
  const showToast = useStore((s) => s.showToast);
  const refreshOrders = useStore((s) => s.refreshOrders);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = order.paymentStatus;

  const onCopy = async (text, label) => {
    haptic.tap();
    if (await copy(text)) showToast(`✓ ${label}`);
  };

  // Ilovani oldindan to'ldirib ochib bo'lmaydi, shuning uchun karta raqami nusxalanadi, mijoz uni ilovada joylashtiradi
  const openApp = async (url) => {
    haptic.tap();
    if (await copy(String(cardNumber).replace(/\D/g, ''))) showToast(`✓ ${t('pay.copiedOpen')}`);
    setTimeout(() => open(url), 350);
  };

  const paid = async () => {
    setBusy(true); setError('');
    try {
      const o = await api.post(`/api/orders/${order.id}/paid`);
      haptic.success();
      onChange?.(o);
      refreshOrders();
    } catch (e) { haptic.error(); setError(e.message); } finally { setBusy(false); }
  };

  if (status === 'PAID') {
    return <p className="rounded-2xl bg-ok/15 p-4 text-center text-[14px] font-bold text-ok">✅ {t('pay.confirmed')}</p>;
  }
  if (status === 'PENDING') {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4 text-center">
        <p className="text-[15px] font-bold text-accent">⏳ {t('pay.pending')}</p>
        <p className="mt-1 text-[12.5px] text-muted">{t('pay.pendingSub')}</p>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="rounded-2xl border border-line bg-surface-2 p-4">
        <p className="text-[12px] font-bold uppercase tracking-widest text-muted">{t('pay.amount')}</p>
        <p className="mt-0.5 text-[26px] font-black text-gold">{money(order.total)} <span className="text-[13px] font-semibold text-muted">{t('sum')}</span></p>

        <p className="mt-4 text-[12px] font-bold uppercase tracking-widest text-muted">{t('pay.card')}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="whitespace-nowrap font-mono text-[17px] font-extrabold">{fmtCard(cardNumber)}</p>
          <button onClick={() => onCopy(String(cardNumber).replace(/\D/g, ''), t('pay.copied'))}
            className="shrink-0 rounded-full border border-accent px-3 py-1.5 text-[12.5px] font-bold text-accent active:scale-95">📋 {t('pay.copy')}</button>
        </div>
        {cardHolder && <p className="mt-1 text-[13px] text-muted">{cardHolder}</p>}
        <p className="mt-3 text-[12.5px] text-muted">{t('pay.hint')} <b className="text-cream">#{order.id}</b></p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => openApp('https://payme.uz')} className="rounded-2xl border border-line bg-surface-2 py-3 text-[14px] font-bold">
          <span className="text-[#2cc5bd]">●</span> Payme
        </button>
        <button onClick={() => openApp('https://click.uz')} className="rounded-2xl border border-line bg-surface-2 py-3 text-[14px] font-bold">
          <span className="text-[#1aa6e6]">●</span> Click
        </button>
      </div>

      {error && <p className="mt-3 text-center text-[13px] font-semibold text-bad">{error}</p>}
      <button className="btn-primary mt-3 w-full" disabled={busy} onClick={paid}>{busy ? '…' : `✓ ${t('pay.paid')}`}</button>
      <p className="mt-2 text-center text-[11.5px] text-muted">{t('pay.after')}</p>
    </div>
  );
}
