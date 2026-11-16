import { motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';

// Brend yuklanish animatsiyasi: halqa chiziladi, logo chiqadi, yozuv paydo bo'ladi
export default function Splash({ failed, onRetry }) {
  const { t } = useT();
  return (
    <motion.div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.45 }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(180,199,111,0.2),transparent_62%)]" />
      <div className="relative grid h-[190px] w-[190px] place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 190 190">
          <motion.circle cx="95" cy="95" r="90" fill="none" stroke="#b4c76f" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 1.3, ease: 'easeInOut' }} />
        </svg>
        <motion.img src="/logo.png" alt="ZAYD" draggable={false}
          className="h-[162px] w-[162px] rounded-full shadow-[0_14px_50px_-8px_rgba(180,199,111,0.5)]"
          initial={{ scale: 0.4, opacity: 0, rotate: -12 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.15 }} />
      </div>
      <motion.p className="mt-9 font-display text-[14px] tracking-[0.26em] text-accent"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.6 }}>
        {t('tagline').toUpperCase()}
      </motion.p>
      {failed ? (
        <motion.div className="mt-8 flex flex-col items-center gap-4 px-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-muted">{t('loadError')}</p>
          <button className="btn-primary px-8" onClick={onRetry}>{t('retry')}</button>
        </motion.div>
      ) : (
        <motion.div className="mt-8 flex gap-1.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="h-2 w-2 rounded-full bg-accent"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
