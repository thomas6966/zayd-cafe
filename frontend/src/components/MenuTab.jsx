import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { haptic, tgUser } from '../lib/tg.js';
import { useStore } from '../lib/store.js';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import { Chip, Logo, ThemeToggle } from './ui.jsx';
import { loc } from '../lib/format.js';

export function LangSwitch() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <div className="flex rounded-full border border-line bg-surface p-0.5 text-[12px] font-extrabold">
      {['uz', 'ru'].map((l) => (
        <button key={l} onClick={() => { haptic.select(); setLang(l); }}
          className={`rounded-full px-3 py-1.5 transition-colors ${lang === l ? 'bg-accent text-on-accent' : 'text-muted'}`}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

// Ixcham til tugmasi (sarlavha uchun): bosilsa til almashadi
export function LangButton() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  return (
    <button onClick={() => { haptic.select(); setLang(lang === 'uz' ? 'ru' : 'uz'); }}
      className="grid h-9 min-w-9 shrink-0 place-items-center rounded-full border border-line bg-surface px-2 text-[12px] font-extrabold">
      {lang.toUpperCase()}
    </button>
  );
}

export function Avatar({ size = 38 }) {
  const u = tgUser();
  const [failed, setFailed] = useState(false);
  return u?.photo_url && !failed ? (
    <img src={u.photo_url} alt="" onError={() => setFailed(true)} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <div className="grid place-items-center rounded-full bg-accent/20 font-bold text-accent" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {(u?.first_name || 'Z').slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function MenuTab() {
  const { t, lang } = useT();
  const menu = useStore((s) => s.menu);
  const favorites = useStore((s) => s.favorites);
  const addToCart = useStore((s) => s.addToCart);
  const showToast = useStore((s) => s.showToast);
  const setTab = useStore((s) => s.setTab);

  const [q, setQ] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);
  const [active, setActive] = useState(menu[0]?.id);
  const [open, setOpen] = useState(null);
  const tabsRef = useRef(null);
  const lockUntil = useRef(0);
  const user = tgUser();

  const filtering = q.trim().length > 0 || onlyFav;

  const results = useMemo(() => {
    if (!filtering) return [];
    const needle = q.trim().toLowerCase();
    const out = [];
    for (const c of menu) for (const p of c.products) {
      if (onlyFav && !favorites.includes(p.id)) continue;
      if (needle && !`${p.name} ${p.nameUz || ''} ${p.description}`.toLowerCase().includes(needle)) continue;
      out.push({ product: p, category: c });
    }
    return out;
  }, [menu, q, onlyFav, favorites, filtering]);

  // Scroll-spy: sticky sarlavha ostidagi kategoriya belgilanadi
  useEffect(() => {
    if (filtering) return;
    const obs = new IntersectionObserver((entries) => {
      if (Date.now() < lockUntil.current) return;
      const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (hit) setActive(Number(hit.target.dataset.cat));
    }, { rootMargin: '-190px 0px -65% 0px' });
    document.querySelectorAll('[data-cat]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [menu, filtering]);

  useEffect(() => {
    const strip = tabsRef.current;
    const el = strip?.querySelector(`[data-tab="${active}"]`);
    if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const goTo = (id) => {
    haptic.select();
    setActive(id);
    lockUntil.current = Date.now() + 900;
    document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const quickAdd = (p) => { addToCart(p.id, 1, ''); haptic.success(); showToast(`✓ ${loc(p, lang)}`); };
  // Ichimlik va pitsa/burgerlarda sozlamalar bor — "+" oynani ochadi; souslar/fri/stripslarda to'g'ridan-to'g'ri qo'shiladi
  const SIMPLE = ['Соусы', 'Дополнительно'];

  const grid = (items) => (
    <div className="grid grid-cols-2 gap-3">
      {items.map(({ product, category }) => (
        <ProductCard key={product.id} product={product} icon={category.emoji}
          quickAdd={SIMPLE.includes(category.name)}
          onOpen={() => setOpen({ product, category })} onQuickAdd={() => quickAdd(product)} />
      ))}
    </div>
  );

  return (
    <div>
      <div className="safe-top px-4 pt-3">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[19px] font-bold leading-tight">{t('hello', { name: user?.first_name || 'ZAYD' })}</p>
            <p className="truncate text-[12.5px] text-muted">{t('sub')}</p>
          </div>
          <ThemeToggle />
          <LangButton />
          <button onClick={() => setTab('profile')} aria-label="profile"><Avatar /></button>
        </div>
      </div>

      <div className="glass sticky top-0 z-30 mt-3 rounded-b-3xl border-x-0 border-t-0 px-4 pb-2.5 pt-2.5">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input className="field !rounded-full !py-2.5 !pl-10 !pr-10" placeholder={t('search')} value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
          {q && <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setQ('')} aria-label="clear">✕</button>}
        </div>
        <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
          <Chip active={onlyFav} onClick={() => { haptic.select(); setOnlyFav(!onlyFav); }}>❤️ {t('tag.fav')}</Chip>
        </div>
        {!filtering && (
          <div ref={tabsRef} className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
            {menu.map((c) => (
              <button key={c.id} data-tab={c.id} onClick={() => goTo(c.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-bold transition-colors ${active === c.id ? 'bg-cream text-bg' : 'bg-surface-2 text-muted'}`}>
                <span>{c.emoji}</span>{loc(c, lang)}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-44 pt-4">
        {filtering ? (
          results.length ? grid(results) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
              <div className="text-5xl">🔎</div>
              <p className="mt-3 text-lg font-bold">{t('empty')}</p>
              <p className="mt-1 text-sm text-muted">{t('emptySub')}</p>
            </motion.div>
          )
        ) : (
          menu.filter((c) => c.products.length).map((c) => (
            <section key={c.id} id={`cat-${c.id}`} data-cat={c.id} className="mb-8 scroll-mt-[210px]">
              <h2 className="mb-3 flex items-center gap-2 font-display text-[22px] font-bold"><span>{c.emoji}</span> {loc(c, lang)}</h2>
              {grid(c.products.map((p) => ({ product: p, category: c })))}
            </section>
          ))
        )}
      </div>

      <ProductModal product={open?.product ?? null} category={open?.category} onClose={() => setOpen(null)} />
    </div>
  );
}
