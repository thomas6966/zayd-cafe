import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { haptic } from '../lib/tg.js';
import { money, timeStr } from '../lib/format.js';
import { productMap, useStore } from '../lib/store.js';

export const ACTIVE = ['NEW', 'PREPARING', 'READY', 'DELIVERING'];

const stepsFor = (o) => (o.deliveryType === 'DELIVERY' ? ['NEW', 'PREPARING', 'DELIVERING', 'COMPLETED'] : ['NEW', 'PREPARING', 'READY', 'COMPLETED']);

function Tracker({ order }) {
  const { t } = useT();
  const steps = stepsFor(order);
  // READY (yetkazishda) -> "yo'lda" bosqichiga yaqin
  const current = Math.max(0, steps.indexOf(order.status === 'READY' && order.deliveryType === 'DELIVERY' ? 'PREPARING' : order.status));
  return (
    <div className="relative mt-4 flex justify-between">
      <div className="absolute left-[12%] right-[12%] top-[11px] h-[3px] rounded-full bg-cream/10" />
      <motion.div className="absolute left-[12%] top-[11px] h-[3px] rounded-full bg-accent" initial={false}
        animate={{ width: `${(current / (steps.length - 1)) * 76}%` }} transition={{ duration: 0.6 }} />
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <div key={s} className="relative z-10 flex w-1/4 flex-col items-center">
            <motion.div animate={i === current ? { scale: [1, 1.18, 1] } : { scale: 1 }}
              transition={{ repeat: i === current ? Infinity : 0, duration: 1.6 }}
              className={`grid h-6 w-6 place-items-center rounded-full border-2 text-[11px] font-black ${done ? 'border-accent bg-accent text-on-accent' : 'border-cream/25 bg-surface text-transparent'}`}>✓</motion.div>
            <span className={`mt-1.5 text-center text-[10.5px] font-semibold leading-tight ${done ? 'text-cream' : 'text-muted'}`}>{t(`status.${s}`)}</span>
          </div>
        );
      })}
    </div>
  );
}

function Lines({ order, products }) {
  return (
    <div className="mt-3 flex flex-col gap-1.5">
      {order.items.map((i) => {
        const p = products.get(i.productId);
        return (
          <div key={i.id} className="flex items-center gap-2.5 text-[13px]">
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2">
              {p?.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : '🍽️'}
            </div>
            <span className="min-w-0 flex-1 truncate">
              <span className="font-bold text-accent">{i.quantity}×</span> {i.name}
              {i.note && <span className="text-muted"> · {i.note}</span>}
            </span>
            <span className="text-muted">{money(i.price * i.quantity)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersTab() {
  const { t, lang } = useT();
  const orders = useStore((s) => s.orders);
  const menu = useStore((s) => s.menu);
  const refreshOrders = useStore((s) => s.refreshOrders);
  const addToCart = useStore((s) => s.addToCart);
  const showToast = useStore((s) => s.showToast);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const products = productMap(menu);
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  useEffect(() => {
    refreshOrders();
    const id = setInterval(() => { if (!document.hidden) refreshOrders(); }, 5000);
    return () => clearInterval(id);
  }, [refreshOrders]);

  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const history = orders.filter((o) => !ACTIVE.includes(o.status));

  const reorder = (o) => {
    haptic.success();
    let added = 0;
    for (const i of o.items) if (i.productId && products.has(i.productId)) { addToCart(i.productId, i.quantity, i.note || '', (i.addons || []).map((a) => a.id)); added++; }
    if (added) { showToast(`✓ ${t('orders.reordered')}`); setCartOpen(true); }
  };

  return (
    <div className="safe-top px-4 pb-44 pt-4">
      <h1 className="font-display text-[30px] font-bold">{t('orders.title')}</h1>

      {orders.length === 0 && (
        <div className="py-20 text-center">
          <div className="text-6xl">🧾</div>
          <p className="mt-3 text-lg font-bold">{t('orders.empty')}</p>
          <p className="mt-1 text-sm text-muted">{t('orders.emptySub')}</p>
        </div>
      )}

      {active.length > 0 && (
        <>
          <h2 className="mb-3 mt-5 text-[13px] font-bold uppercase tracking-wider text-muted">{t('orders.active')}</h2>
          <div className="flex flex-col gap-3">
            {active.map((o) => (
              <motion.div layout key={o.id} className="rounded-3xl border border-accent/30 bg-surface p-4 shadow-[0_10px_40px_-20px_rgba(180,199,111,0.5)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[18px] font-extrabold">{o.deliveryType === 'DELIVERY' ? '🛵' : '🛍️'} #{o.id}</p>
                    <p className="text-[12px] text-muted">{timeStr(o.createdAt, locale)}</p>
                  </div>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-[12px] font-bold text-accent">{t(`status.${o.status}`)}</span>
                </div>
                <Tracker order={o} />
                <Lines order={o} products={products} />
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <p className="text-[16px] font-extrabold text-gold">{money(o.total)} {t('sum')}</p>
                  <p className="text-[12px] font-semibold text-muted">{o.paymentMethod === 'CASH' ? t('cart.cash') : t('cart.terminal')}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {history.length > 0 && (
        <>
          <h2 className="mb-3 mt-7 text-[13px] font-bold uppercase tracking-wider text-muted">{t('orders.history')}</h2>
          <div className="flex flex-col gap-3">
            {history.map((o) => (
              <div key={o.id} className="rounded-3xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[16px] font-bold">#{o.id}</p>
                    <p className="text-[12px] text-muted">{timeStr(o.createdAt, locale)} · {t('orders.items', { n: o.items.reduce((s, i) => s + i.quantity, 0) })}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${o.status === 'COMPLETED' ? 'bg-ok/15 text-ok' : 'bg-bad/15 text-bad'}`}>{t(`status.${o.status}`)}</span>
                </div>
                <Lines order={o} products={products} />
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <p className="text-[15px] font-extrabold text-gold">{money(o.total)} {t('sum')}</p>
                  <button className="rounded-full border border-accent px-4 py-2 text-[13px] font-bold text-accent active:scale-95" onClick={() => reorder(o)}>↻ {t('orders.reorder')}</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
