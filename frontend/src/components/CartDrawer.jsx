// Savat + buyurtma rasmiylashtirish
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api.js';
import { useT } from '../lib/i18n.js';
import { haptic } from '../lib/tg.js';
import { money } from '../lib/format.js';
import { lineAddons, productMap, unitPrice, useStore } from '../lib/store.js';
import { Img, Sheet, Stepper } from './ui.jsx';

function Label({ children }) {
  return <h4 className="mb-2 mt-5 text-[13px] font-bold uppercase tracking-wider text-muted">{children}</h4>;
}

export default function CartDrawer() {
  const { t } = useT();
  const open = useStore((s) => s.cartOpen);
  const setOpen = useStore((s) => s.setCartOpen);
  const menu = useStore((s) => s.menu);
  const cart = useStore((s) => s.cart);
  const savedPhone = useStore((s) => s.phone);
  const config = useStore((s) => s.config);
  const { setQty, clearCart, setPhone, setPlaced, showToast, refreshOrders } = useStore.getState();

  const [deliveryType, setDeliveryType] = useState('PICKUP');
  const [payment, setPayment] = useState('CASH');
  const [phone, setPhoneInput] = useState(savedPhone || '+998');
  const [address, setAddress] = useState('');
  const [geo, setGeo] = useState(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [applied, setApplied] = useState('');
  const [promoErr, setPromoErr] = useState('');
  const [quote, setQuote] = useState(null);

  const products = useMemo(() => productMap(menu), [menu]);
  const lines = cart.map((l) => ({ ...l, product: products.get(l.productId) })).filter((l) => l.product);
  const addons = config.addons;
  const localSubtotal = lines.reduce((s, l) => s + unitPrice(l, l.product, addons) * l.quantity, 0);

  // Serverdan narx (promo-kod, yetkazish narxi) — kichik kechikish bilan
  useEffect(() => {
    if (!open || lines.length === 0) return;
    let off = false;
    const id = setTimeout(async () => {
      try {
        const q = await api.post('/api/quote', {
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, addonIds: l.addonIds || [] })),
          deliveryType, promoCode: applied || undefined,
        });
        if (off) return;
        setQuote(q);
        if (applied && q.promoError) { setPromoErr(q.promoError); setApplied(''); }
      } catch { /* oflayn bo'lsa mahalliy hisob ishlatiladi */ }
    }, 250);
    return () => { off = true; clearTimeout(id); };
  }, [open, cart, deliveryType, applied]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = quote || { subtotal: localSubtotal, discount: 0, deliveryFee: 0, total: localSubtotal, promo: null };
  const total = totals.total;
  const minOrder = config.settings.minOrder;
  const belowMin = minOrder > 0 && localSubtotal < minOrder;

  const applyPromo = () => {
    const code = promoInput.trim();
    if (!code) return;
    haptic.tap();
    setPromoErr('');
    setApplied(code);
  };

  const pin = () => {
    haptic.tap();
    if (!navigator.geolocation) return showToast(t('cart.pinFail'));
    navigator.geolocation.getCurrentPosition(
      (p) => { setGeo({ latitude: p.coords.latitude, longitude: p.coords.longitude }); showToast(`📍 ${t('cart.pinned')}`); },
      () => showToast(t('cart.pinFail')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const place = async () => {
    if (phone.replace(/\D/g, '').length < 9) { haptic.error(); return setError(t('err.phone')); }
    if (deliveryType === 'DELIVERY' && !address.trim() && !geo) { haptic.error(); return setError(t('err.address')); }
    if (belowMin) return setError(`${t('cart.minOrder')}: ${money(minOrder)} ${t('sum')}`);
    setError('');
    setBusy(true);
    try {
      const order = await api.post('/api/orders', {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, note: l.note, addonIds: l.addonIds || [] })),
        deliveryType, paymentMethod: payment, phone, comment, promoCode: applied || undefined,
        address: deliveryType === 'DELIVERY' ? address : undefined,
        ...(deliveryType === 'DELIVERY' && geo ? geo : {}),
      });
      haptic.success();
      setPhone(phone);
      clearCart();
      setOpen(false);
      setComment('');
      setApplied(''); setPromoInput(''); setQuote(null);
      setPlaced(order);
      refreshOrders();
    } catch (e) {
      haptic.error();
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const opt = (active) => `rounded-2xl border px-2 py-3 text-center text-[13px] font-bold transition-colors ${active ? 'border-accent bg-accent/15 text-cream' : 'border-line bg-surface-2 text-muted'}`;

  return (
    <Sheet open={open} onClose={() => setOpen(false)}>
      <div className="flex shrink-0 items-center justify-between px-5 pb-2">
        <h2 className="font-display text-[26px] font-bold">{t('cart.title')}</h2>
        {lines.length > 0 && (
          <button className="text-[13px] font-semibold text-muted" onClick={() => { clearCart(); setOpen(false); }}>✕ {t('cart.clear')}</button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="px-5 pb-12 pt-10 text-center">
          <div className="text-6xl">🛒</div>
          <p className="mt-3 text-lg font-bold">{t('cart.empty')}</p>
          <p className="mt-1 text-sm text-muted">{t('cart.emptySub')}</p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
            <div className="flex flex-col gap-3">
              {lines.map((l) => (
                <motion.div layout key={l.key} className="flex gap-3 rounded-2xl border border-line bg-surface-2 p-2.5">
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-surface">
                    <Img src={l.product.imageUrl} alt="" fallback={l.product.category.emoji} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-[14px] font-bold">{l.product.name}</p>
                    {(l.note || lineAddons(l, l.product, addons).length > 0) && (
                      <p className="line-clamp-2 text-[11.5px] leading-snug text-muted">
                        {[...lineAddons(l, l.product, addons).map((a) => `+ ${a.name}`), l.note].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <span className="text-[14px] font-extrabold text-gold">{money(unitPrice(l, l.product, addons) * l.quantity)}</span>
                      <Stepper value={l.quantity} onChange={(n) => { haptic.select(); setQty(l.key, n); }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <Label>{t('cart.fulfillment')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button className={opt(deliveryType === 'PICKUP')} onClick={() => { haptic.select(); setDeliveryType('PICKUP'); setError(''); }}>
                <div className="text-xl">🛍️</div><div className="mt-1">{t('cart.pickup')}</div>
              </button>
              <button className={opt(deliveryType === 'DELIVERY')} onClick={() => { haptic.select(); setDeliveryType('DELIVERY'); setError(''); }}>
                <div className="text-xl">🛵</div><div className="mt-1">{t('cart.delivery')}</div>
              </button>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div className="mt-3">
                <textarea className="field resize-none" rows={2} placeholder={t('cart.address')} value={address} onChange={(e) => setAddress(e.target.value)} />
                <button onClick={pin} className={`mt-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold ${geo ? 'border-ok text-ok' : 'border-line text-muted'}`}>
                  📍 {geo ? t('cart.pinned') : t('cart.pin')}
                </button>
              </div>
            )}

            <div className="mt-3 grid gap-2">
              <input className="field" type="tel" inputMode="tel" placeholder={t('cart.phone')} value={phone} onChange={(e) => setPhoneInput(e.target.value)} />
              <input className="field" maxLength={200} placeholder={t('cart.note')} value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>

            <Label>{t('cart.promo')}</Label>
            <div className="flex gap-2">
              <input className="field uppercase" placeholder={t('cart.promoPh')} value={promoInput} autoCapitalize="characters"
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && applyPromo()} />
              <button className="shrink-0 rounded-[14px] border border-accent px-4 text-[14px] font-bold text-accent" onClick={applyPromo}>{t('cart.promoApply')}</button>
            </div>
            {totals.promo && applied && <p className="mt-2 text-[13px] font-semibold text-ok">✓ {t('cart.promoOk')}: {totals.promo.code} {totals.promo.type === 'PERCENT' ? `−${totals.promo.value}%` : `−${money(totals.promo.value)}`}</p>}
            {promoErr && <p className="mt-2 text-[13px] font-semibold text-bad">{promoErr}</p>}

            <Label>{t('cart.payment')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button className={opt(payment === 'CASH')} onClick={() => { haptic.select(); setPayment('CASH'); }}><div className="text-xl">💵</div><div className="mt-1">{t('cart.cash')}</div></button>
              <button className={opt(payment === 'TERMINAL')} onClick={() => { haptic.select(); setPayment('TERMINAL'); }}><div className="text-xl">💳</div><div className="mt-1">{t('cart.terminal')}</div></button>
            </div>
            <p className="mt-2 text-[12px] text-muted">{t('cart.payHint')}</p>

            <div className="mt-5 space-y-2 rounded-2xl border border-line bg-surface-2 p-4 text-[14px]">
              <div className="flex justify-between"><span className="text-muted">{t('cart.subtotal')}</span><span className="font-semibold">{money(totals.subtotal)}</span></div>
              {totals.discount > 0 && <div className="flex justify-between"><span className="text-muted">{t('cart.discount')}</span><span className="font-semibold text-ok">−{money(totals.discount)}</span></div>}
              {deliveryType === 'DELIVERY' && <div className="flex justify-between"><span className="text-muted">{t('cart.deliveryFee')}</span><span className={`font-semibold ${totals.deliveryFee > 0 ? '' : 'text-ok'}`}>{totals.deliveryFee > 0 ? money(totals.deliveryFee) : t('cart.free')}</span></div>}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <span className="text-[15px] font-bold">{t('cart.total')}</span>
                <span className="text-[22px] font-extrabold text-gold">{money(total)} <span className="text-[12px] font-semibold text-muted">{t('sum')}</span></span>
              </div>
              <p className="text-right text-[11.5px] text-muted">✓ {t('cart.noFees')}</p>
            </div>
          </div>

          <div className="glass safe-bottom shrink-0 border-x-0 border-b-0 px-5 pt-3">
            {(error || belowMin) && <p className="mb-2 text-center text-[13px] font-semibold text-bad">{belowMin ? `${t('cart.minOrder')}: ${money(minOrder)} ${t('sum')}` : error}</p>}
            <button className="btn-primary flex w-full items-center justify-between" disabled={busy || belowMin} onClick={place}>
              <span>{busy ? t('cart.placing') : t('cart.place')}</span>
              {!busy && <span>{money(total)}</span>}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
