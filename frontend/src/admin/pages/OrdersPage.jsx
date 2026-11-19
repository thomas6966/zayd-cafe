// Jonli buyurtmalar (har 5 soniyada yangilanadi)
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { moneySum, STATUS, timeStr } from '../../lib/format.js';
import { Empty, ErrorText, Modal, PageTitle } from '../ui.jsx';

const FILTERS = [['NEW', 'Yangi'], ['PREPARING', 'Tayyorlanmoqda'], ['READY', 'Tayyor'], ['DELIVERING', "Yo'lda"], ['COMPLETED', 'Yakunlangan'], ['CANCELLED', 'Bekor']];

const ACTIONS = (o) => ({
  NEW: [['PREPARING', '👨‍🍳 Tayyorlashni boshlash'], ['CANCELLED', '❌ Bekor qilish']],
  PREPARING: [['READY', '✅ Tayyor'], ['CANCELLED', '❌ Bekor qilish']],
  READY: [o.deliveryType === 'DELIVERY' ? ['DELIVERING', "🚚 Yo'lga chiqdi"] : ['COMPLETED', '🎉 Topshirildi'], ['CANCELLED', '❌ Bekor qilish']],
  DELIVERING: [['COMPLETED', '🎉 Yetkazildi'], ['CANCELLED', '❌ Bekor qilish']],
  COMPLETED: [], CANCELLED: [],
}[o.status]);

const PAY_STATUS = {
  PAID: ['✅ To\'langan', 'bg-ok/20 text-ok'],
  PENDING: ['⏳ To\'lov tekshiriladi', 'bg-amber-500/20 text-amber-500'],
  UNPAID: ['💳 To\'lanmagan', 'bg-bad/20 text-bad'],
};
const payLabel = (o) => (o.paymentMethod === 'ONLINE' ? 'Onlayn karta' : o.paymentMethod === 'CASH' ? 'Naqd' : 'Terminal (olganda)');

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.15;
    o.start(); o.stop(ctx.currentTime + 0.25);
  } catch { /* ignore */ }
}

function OrderModal({ order, onClose, onChange }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = async (s) => {
    if (s === 'CANCELLED' && !confirm('Buyurtmani bekor qilasizmi?')) return;
    setBusy(true); setErr('');
    try { onChange(await api.patch(`/api/admin/orders/${order.id}/status`, { status: s })); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  const u = order.user;
  const acts = ACTIONS(order);
  const online = order.paymentMethod === 'ONLINE';
  const needsPay = online && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED';
  const setPay = async (paymentStatus) => {
    setBusy(true); setErr('');
    try { onChange(await api.patch(`/api/admin/orders/${order.id}/payment`, { paymentStatus })); } catch (e) { setErr(e.message); }
    setBusy(false);
  };
  return (
    <Modal open onClose={onClose} title={`Buyurtma #${order.id}`}>
      <div className="flex items-center justify-between">
        <span className={`badge text-white ${STATUS[order.status].color}`}>{STATUS[order.status].label}</span>
        <span className="text-xs text-muted">{timeStr(order.createdAt)}</span>
      </div>
      <div className="mt-4 space-y-1 text-sm">
        <p>👤 {u.firstName} {u.username && <a className="underline" href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a>}</p>
        <p>📞 <a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p>
        <p>{order.deliveryType === 'DELIVERY' ? '🚚 Yetkazib berish' : '🏪 Olib ketish'} · 💳 {payLabel(order)}</p>
        {order.address && <p>📍 {order.address}</p>}
        {order.latitude != null && <p><a className="underline" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}>🗺 Xaritada ochish</a></p>}
        {order.comment && <p>💬 {order.comment}</p>}
      </div>
      <div className="mt-4 rounded-xl bg-surface-2 p-3 text-sm">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between gap-3 py-1">
            <span>
              {i.name} × {i.quantity}
              {i.addons?.length > 0 && <em className="block text-xs text-muted">+ {i.addons.map((a) => a.name).join(', ')}</em>}
              {i.note && <em className="block text-xs text-muted">({i.note})</em>}
            </span>
            <span className="shrink-0">{moneySum(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="mt-2 space-y-1 border-t border-line pt-2">
          {order.discount > 0 && <div className="flex justify-between text-ok"><span>🏷 Promo {order.promoCode}</span><span>−{moneySum(order.discount)}</span></div>}
          {order.deliveryFee > 0 && <div className="flex justify-between"><span>🚚 Yetkazish</span><span>{moneySum(order.deliveryFee)}</span></div>}
          <div className="flex justify-between text-base font-bold"><span>Jami</span><span>{moneySum(order.total)}</span></div>
        </div>
      </div>
      {online && (
        <div className={`mt-4 rounded-xl border p-3 ${order.paymentStatus === 'PAID' ? 'border-ok/40 bg-ok/10' : 'border-amber-500/40 bg-amber-500/10'}`}>
          <p className="text-sm font-bold">{PAY_STATUS[order.paymentStatus][0]}</p>
          <p className="mt-0.5 text-xs text-muted">
            {order.paymentStatus === 'PAID' ? "To'lov tasdiqlangan." : order.paymentStatus === 'PENDING'
              ? "Mijoz \"to'ladim\" dedi. Payme/Click'da pul tushganini tekshiring." : "Mijoz hali to'lov qilmagan."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED' && (
              <button disabled={busy} onClick={() => setPay('PAID')} className="btn-primary !rounded-xl !py-2 !text-sm disabled:opacity-50">✅ To'lovni tasdiqlash</button>
            )}
            {order.paymentStatus === 'PENDING' && <button disabled={busy} onClick={() => setPay('UNPAID')} className="btn disabled:opacity-50">↩️ To'lov kelmadi</button>}
            {order.paymentStatus === 'PAID' && order.status === 'NEW' && <button disabled={busy} onClick={() => setPay('UNPAID')} className="btn disabled:opacity-50">↩️ Tasdiqni bekor qilish</button>}
          </div>
        </div>
      )}
      {err && <ErrorText>{err}</ErrorText>}
      <div className="mt-4 grid gap-2">
        {acts.map(([s, label], i) => (
          <button key={s} disabled={busy || (needsPay && s !== 'CANCELLED')} onClick={() => set(s)} className={`${i === 0 && s !== 'CANCELLED' ? 'btn-primary' : 'btn'} disabled:opacity-50`}>{label}</button>
        ))}
        {needsPay && acts.length > 0 && <p className="text-center text-xs text-amber-500">To'lov tasdiqlangach tayyorlash mumkin</p>}
        {acts.length === 0 && <p className="text-center text-sm text-muted">Buyurtma yopilgan</p>}
      </div>
      <p className="mt-3 text-center text-xs text-muted">Status o'zgarganda mijozga Telegram orqali xabar boradi.</p>
    </Modal>
  );
}

export default function OrdersPage({ onNew }) {
  const [filter, setFilter] = useState('NEW');
  const [orders, setOrders] = useState(null);
  const [counts, setCounts] = useState({});
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const lastNew = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = await api.get(`/api/admin/orders?status=${filter}`);
      setOrders(d.orders); setCounts(d.counts); setError('');
      const n = d.counts.NEW || 0;
      if (lastNew.current !== null && n > lastNew.current) beep();
      lastNew.current = n;
      onNew?.(n);
    } catch (e) { setError(e.message); }
  }, [filter, onNew]);

  useEffect(() => { setOrders(null); load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);

  return (
    <div>
      <PageTitle>Buyurtmalar</PageTitle>
      <nav className="mb-5 flex gap-2 overflow-x-auto">
        {FILTERS.map(([s, l]) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${filter === s ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface text-muted'}`}>
            {l}{counts[s] ? <span className="ml-2 rounded-full bg-accent px-1.5 text-xs text-on-accent">{counts[s]}</span> : null}
          </button>
        ))}
      </nav>

      {error && <ErrorText>{error}</ErrorText>}
      {!orders && !error && <p className="text-muted">Yuklanmoqda…</p>}
      {orders?.length === 0 && <div className="card"><Empty>Bu bo'limda buyurtmalar yo'q</Empty></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {orders?.map((o) => (
          <button key={o.id} onClick={() => setOpen(o)} className="card p-4 text-left transition hover:border-accent anim-fade">
            <div className="flex items-center justify-between">
              <b className="text-lg">#{o.id}</b>
              <span className="text-xs text-muted">{timeStr(o.createdAt)}</span>
            </div>
            <p className="mt-1 font-semibold">{o.user.firstName} <span className="text-sm font-normal text-muted">{o.phone}</span></p>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
            <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
              <span>{o.deliveryType === 'DELIVERY' ? '🚚 Yetkazish' : '🏪 Olib ketish'}</span>
              {o.paymentMethod === 'ONLINE' && <span className={`badge ${PAY_STATUS[o.paymentStatus][1]}`}>{PAY_STATUS[o.paymentStatus][0]}</span>}
              <b className="text-gold">{moneySum(o.total)}</b>
            </div>
          </button>
        ))}
      </div>
      {open && <OrderModal order={open} onClose={() => setOpen(null)} onChange={(o) => { setOpen(o); load(); }} />}
    </div>
  );
}
