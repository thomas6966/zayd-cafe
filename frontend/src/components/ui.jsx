// Umumiy UI: Logo, Sheet, Stepper, Chip, Toast, Img, HeartButton
import { useEffect } from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { pushBack } from '../lib/tg.js';
import { useStore } from '../lib/store.js';
import { useTheme } from '../lib/theme.js';

export function Logo({ size = 96 }) {
  return (
    <img
      src="/logo.png" alt="ZAYD" draggable={false}
      className="rounded-full select-none shadow-[0_10px_40px_-8px_rgba(180,199,111,0.45)]"
      style={{ width: size, height: size }}
    />
  );
}

let locks = 0;
function useScrollLock(active) {
  useEffect(() => {
    if (!active) return;
    locks++;
    document.body.style.overflow = 'hidden';
    return () => { locks--; if (locks <= 0) document.body.style.overflow = ''; };
  }, [active]);
}

export function Sheet({ open, onClose, children, z = 50 }) {
  const controls = useDragControls();
  useScrollLock(open);
  useEffect(() => (open ? pushBack(onClose) : undefined), [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0" style={{ zIndex: z }} initial={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.div
            className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-surface text-cream"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 340 }}
            drag="y" dragListener={false} dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => { if (info.offset.y > 110 || info.velocity.y > 700) onClose(); }}
          >
            <div className="flex shrink-0 cursor-grab touch-none justify-center py-2.5" onPointerDown={(e) => controls.start(e)}>
              <div className="h-1.5 w-11 rounded-full bg-cream/15" />
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Stepper({ value, onChange, min = 0 }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1">
      <button aria-label="minus" disabled={value <= min} onClick={() => onChange(value - 1)}
        className="grid h-8 w-8 place-items-center rounded-full bg-cream/5 text-lg font-bold leading-none text-cream active:scale-90 disabled:opacity-30">−</button>
      <span className="min-w-7 text-center text-[15px] font-bold tabular-nums">{value}</span>
      <button aria-label="plus" onClick={() => onChange(value + 1)}
        className="grid h-8 w-8 place-items-center rounded-full bg-accent text-lg font-bold leading-none text-on-accent active:scale-90">+</button>
    </div>
  );
}

export function Chip({ active, onClick, children, className = '' }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors ${active ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-surface text-muted'} ${className}`}>
      {children}
    </button>
  );
}

export function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div key={toast}
          className="glass pointer-events-none fixed inset-x-0 top-[calc(var(--tg-content-safe-area-inset-top,0px)+16px)] z-[100] mx-auto w-fit max-w-[88%] rounded-full px-5 py-2.5 text-center text-sm font-semibold shadow-xl"
          initial={{ opacity: 0, y: -16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}>
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Img({ src, alt, fallback, className = '' }) {
  return src ? (
    <img src={src} alt={alt} loading="lazy" decoding="async" draggable={false} className={className}
      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
  ) : (
    <div className={`grid place-items-center text-5xl opacity-70 ${className}`}>{fallback}</div>
  );
}

export function HeartButton({ active, onClick, size = 36 }) {
  return (
    <motion.button whileTap={{ scale: 0.8 }} aria-label="favorite"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="glass grid place-items-center rounded-full" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" className="text-cream" fill={active ? '#ef8f84' : 'none'} stroke={active ? '#ef8f84' : 'currentColor'} strokeWidth="2" strokeLinejoin="round">
        <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2 0 3.5 1.1 4.4 2.6.9-1.5 2.4-2.6 4.4-2.6 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />
      </svg>
    </motion.button>
  );
}

// Quyosh / oy tugmasi
export function ThemeToggle({ size = 36 }) {
  const [theme, toggle] = useTheme();
  const light = theme === 'light';
  return (
    <motion.button whileTap={{ scale: 0.85, rotate: 20 }} onClick={toggle} aria-label="theme"
      className="grid shrink-0 place-items-center rounded-full border border-line bg-surface text-cream" style={{ width: size, height: size }}>
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {light ? <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /> : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>}
      </svg>
    </motion.button>
  );
}
