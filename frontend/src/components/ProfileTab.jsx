import { useT } from '../lib/i18n.js';
import { haptic, tgUser } from '../lib/tg.js';
import { loc, money } from '../lib/format.js';
import { productMap, useStore } from '../lib/store.js';
import { LangSwitch, Avatar } from './MenuTab.jsx';
import { Img, ThemeToggle } from './ui.jsx';

export default function ProfileTab() {
  const { t, lang } = useT();
  const u = tgUser();
  const orders = useStore((s) => s.orders);
  const menu = useStore((s) => s.menu);
  const favorites = useStore((s) => s.favorites);
  const phone = useStore((s) => s.phone);
  const addToCart = useStore((s) => s.addToCart);
  const showToast = useStore((s) => s.showToast);
  const products = productMap(menu);
  const favProducts = favorites.map((id) => products.get(id)).filter(Boolean);
  const done = orders.filter((o) => o.status === 'COMPLETED');
  const spent = done.reduce((s, o) => s + o.total, 0);

  return (
    <div className="safe-top px-4 pb-44 pt-4">
      <div className="flex flex-col items-center pt-4 text-center">
        <Avatar size={84} />
        <h1 className="mt-3 font-display text-[26px] font-bold">{u?.first_name || 'ZAYD'} {u?.last_name || ''}</h1>
        {u?.username && <p className="text-[13px] text-muted">@{u.username}</p>}
        {phone && <p className="mt-0.5 text-[13px] text-muted">📞 {phone}</p>}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <p className="text-[26px] font-black text-gold">{orders.length}</p>
          <p className="text-[12px] text-muted">{t('profile.orders')}</p>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 text-center">
          <p className="text-[20px] font-black leading-[39px] text-gold">{money(spent)}</p>
          <p className="text-[12px] text-muted">{t('profile.spent')}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <span className="font-bold">{t('profile.lang')}</span>
        <LangSwitch />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
        <span className="font-bold">{t('profile.theme')}</span>
        <ThemeToggle size={40} />
      </div>

      <h2 className="mb-3 mt-7 text-[13px] font-bold uppercase tracking-wider text-muted">❤️ {t('profile.favs')}</h2>
      {favProducts.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-5 text-center text-sm text-muted">{t('profile.noFavs')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {favProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                <Img src={p.imageUrl} alt="" fallback={p.category.emoji} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold">{loc(p, lang)}</p>
                <p className="text-[13px] font-extrabold text-gold">{money(p.price)} {t('sum')}</p>
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xl font-bold text-on-accent active:scale-90"
                onClick={() => { haptic.success(); addToCart(p.id, 1, ''); showToast(`✓ ${loc(p, lang)}`); }}>+</button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center text-[13px] text-muted">
        <p>{t('profile.halal')}</p>
        <p className="mt-1">{t('profile.contact')}</p>
      </div>
    </div>
  );
}
