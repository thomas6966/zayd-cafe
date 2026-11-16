import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { haptic } from '../lib/tg.js';
import { money } from '../lib/format.js';
import { useStore } from '../lib/store.js';
import { HeartButton, Img } from './ui.jsx';

export default function ProductCard({ product, icon, onOpen, onQuickAdd, quickAdd }) {
  const { t } = useT();
  const fav = useStore((s) => s.favorites.includes(product.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);

  return (
    <motion.article layout="position" whileTap={{ scale: 0.975 }} onClick={onOpen}
      className="flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface">
      <div className="relative aspect-[4/3] overflow-hidden skeleton">
        <Img src={product.imageUrl} alt={product.name} fallback={icon} className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/35 to-transparent" />
        <div className="absolute right-2 top-2">
          <HeartButton active={fav} size={32} onClick={() => { haptic.select(); toggleFavorite(product.id); }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-2 text-[14px] font-bold leading-tight">{product.name}</h3>
        {product.description && <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug text-muted">{product.description}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="leading-tight">
            <span className="text-[15px] font-extrabold text-gold">{money(product.price)}</span>
            <span className="ml-1 text-[10px] text-muted">{t('sum')}</span>
          </div>
          <motion.button whileTap={{ scale: 0.8 }} aria-label="add"
            onClick={(e) => { e.stopPropagation(); haptic.tap(); quickAdd ? onQuickAdd() : onOpen(); }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xl font-bold leading-none text-on-accent shadow-[0_6px_16px_-6px_rgba(180,199,111,0.9)]">
            +
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
