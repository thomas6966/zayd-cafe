// Mahsulot oynasi: katta rasm, izoh, shakar (ichimliklar), qo'shimchalar, miqdor
import { useEffect, useState } from 'react';
import { useT } from '../lib/i18n.js';
import { haptic } from '../lib/tg.js';
import { money } from '../lib/format.js';
import { useStore } from '../lib/store.js';
import { HeartButton, Img, Sheet, Stepper } from './ui.jsx';

const SUGAR = [0, 25, 50, 75, 100];
const DRINKS = ['Кофе', 'Чай'];
const QUICK = {
  'Кофе': { uz: ['Muzli', 'Sutsiz', 'Issiq emas'], ru: ['Со льдом', 'Без молока', 'Не горячий'] },
  'Чай': { uz: ['Muzli', 'Limonsiz', 'Ko\'proq limon'], ru: ['Со льдом', 'Без лимона', 'Больше лимона'] },
  'Пицца': { uz: ['Achchiq emas', 'Kesilgan'], ru: ['Не острая', 'Нарезать'] },
  'Бургеры': { uz: ['Piyozsiz', 'Achchiq'], ru: ['Без лука', 'Острый'] },
};

function Section({ title, children }) {
  return (
    <div className="mt-5">
      <h4 className="mb-2.5 text-[13px] font-bold uppercase tracking-wider text-muted">{title}</h4>
      {children}
    </div>
  );
}

export default function ProductModal({ product, category, onClose }) {
  const { t, lang } = useT();
  const addToCart = useStore((s) => s.addToCart);
  const showToast = useStore((s) => s.showToast);
  const fav = useStore((s) => (product ? s.favorites.includes(product.id) : false));
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  const [qty, setQty] = useState(1);
  const [sugar, setSugar] = useState(50);
  const [chips, setChips] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => { setQty(1); setSugar(50); setChips([]); setText(''); setAddonIds([]); }, [product?.id]);

  const isDrink = DRINKS.includes(category?.name);
  const extras = QUICK[category?.name]?.[lang] || [];
  const allAddons = useStore((s) => s.config.addons);
  const addons = allAddons.filter((a) => a.categoryIds.includes(category?.id));
  const [addonIds, setAddonIds] = useState([]);
  const addonsTotal = addons.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const unit = (product?.price || 0) + addonsTotal;

  const add = () => {
    const parts = [];
    if (isDrink) parts.push(`${t('product.sugar')} ${sugar}%`);
    parts.push(...chips, text.trim());
    addToCart(product.id, qty, parts.filter(Boolean).join(', '), addonIds.filter((id) => addons.some((a) => a.id === id)));
    haptic.success();
    showToast(`✓ ${t('product.added')}`);
    onClose();
  };

  return (
    <Sheet open={!!product} onClose={onClose}>
      {product && (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="relative aspect-[16/11] bg-surface-2">
              <Img src={product.imageUrl} alt={product.name} fallback={category?.emoji} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
              <div className="absolute right-3 top-3">
                <HeartButton active={fav} onClick={() => { haptic.select(); toggleFavorite(product.id); }} />
              </div>
            </div>

            <div className="px-5 pb-4">
              <p className="text-[12px] font-bold uppercase tracking-widest text-accent">{category?.emoji} {category?.name}</p>
              <h2 className="mt-1 font-display text-[28px] font-bold leading-tight">{product.name}</h2>
              {product.description && <p className="mt-2 text-[14px] leading-relaxed text-muted">{product.description}</p>}
              <p className="mt-3 text-[22px] font-extrabold text-gold">{money(product.price)} <span className="text-[13px] font-semibold text-muted">{t('sum')}</span></p>

              {isDrink && (
                <Section title={`${t('product.sugar')} · ${sugar}%`}>
                  <input type="range" min={0} max={100} step={25} value={sugar} className="w-full"
                    onChange={(e) => { setSugar(Number(e.target.value)); haptic.select(); }} />
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    {SUGAR.map((s) => <span key={s} className={s === sugar ? 'font-bold text-accent' : ''}>{t(`sugar.${s}`)}</span>)}
                  </div>
                </Section>
              )}

              {addons.length > 0 && (
                <Section title={t('product.paid')}>
                  <div className="flex flex-col gap-2">
                    {addons.map((a) => {
                      const on = addonIds.includes(a.id);
                      return (
                        <button key={a.id} onClick={() => { haptic.select(); setAddonIds(on ? addonIds.filter((i) => i !== a.id) : [...addonIds, a.id]); }}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${on ? 'border-accent bg-accent/10' : 'border-line bg-surface-2'}`}>
                          <span className="flex items-center gap-3 text-[14px] font-semibold">
                            <span className={`grid h-5 w-5 place-items-center rounded-md border text-[12px] ${on ? 'border-accent bg-accent text-on-accent' : 'border-cream/25'}`}>{on && '✓'}</span>
                            {lang === 'ru' && a.nameRu ? a.nameRu : a.name}
                          </span>
                          <span className="text-[13px] font-bold text-gold">+{money(a.price)}</span>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              {extras.length > 0 && (
                <Section title={t('product.extras')}>
                  <div className="flex flex-wrap gap-2">
                    {extras.map((c) => {
                      const on = chips.includes(c);
                      return (
                        <button key={c} onClick={() => { haptic.select(); setChips(on ? chips.filter((x) => x !== c) : [...chips, c]); }}
                          className={`rounded-2xl border px-3.5 py-2.5 text-[14px] font-semibold transition-colors ${on ? 'border-accent bg-accent/15 text-cream' : 'border-line bg-surface-2 text-muted'}`}>
                          {on && '✓ '}{c}
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}

              <div className="mt-5">
                <input className="field" maxLength={100} placeholder={t('product.note')} value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="glass safe-bottom flex shrink-0 items-center gap-3 border-x-0 border-b-0 px-5 pt-3">
            <Stepper value={qty} min={1} onChange={setQty} />
            <button className="btn-primary flex flex-1 items-center justify-between gap-3 whitespace-nowrap !px-4" onClick={add}>
              <span>{t('product.add')}</span>
              <span>{money(unit * qty)}</span>
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
