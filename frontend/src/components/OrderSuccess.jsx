import { AnimatePresence, motion } from 'framer-motion';
import { useT } from '../lib/i18n.js';
import { money } from '../lib/format.js';
import { useStore } from '../lib/store.js';
import PayPanel from './PayPanel.jsx';

export default function OrderSuccess() {
  const { t } = useT();
  const order = useStore((s) => s.placed);
  const setPlaced = useStore((s) => s.setPlaced);
  const setTab = useStore((s) => s.setTab);

  const close = (tab) => { setTab(tab); setPlaced(null); window.scrollTo({ top: 0 }); };

  return (
    <AnimatePresence>
      {order && (
        <motion.div className="fixed inset-0 z-[80] flex flex-col items-center overflow-y-auto bg-bg px-6 py-10 text-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(143,199,154,0.16),transparent_60%)]" />
          <motion.svg className="mt-auto shrink-0" width="110" height="110" viewBox="0 0 124 124" initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
            <motion.circle cx="62" cy="62" r="56" fill="rgba(143,199,154,0.12)" stroke="#8fc79a" strokeWidth="3" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6 }} />
            <motion.path d="M38 64l17 17 32-36" fill="none" stroke="#8fc79a" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.45, duration: 0.5 }} />
          </motion.svg>

          <motion.h1 className="mt-7 font-display text-[30px] font-bold" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>{order.paymentMethod === 'ONLINE' && order.paymentStatus === 'UNPAID' ? t('ok.payTitle') : t('ok.title')}</motion.h1>

          <motion.div className="mt-6 w-full max-w-sm rounded-3xl border border-line bg-surface p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
            <p className="text-[12px] font-bold uppercase tracking-widest text-muted">{t('ok.number')}</p>
            <p className="mt-1 text-[34px] font-black tracking-wide text-gold">#{order.id}</p>
            <div className="my-4 h-px bg-line" />
            <div className="flex justify-between text-[14px]">
              <span className="text-muted">{t('ok.total')}</span>
              <span className="font-bold">{money(order.total)} {t('sum')}</span>
            </div>
            {order.paymentMethod === 'ONLINE' ? (
              <div className="mt-4"><PayPanel order={order} onChange={setPlaced} /></div>
            ) : (
              <p className="mt-3 text-[12px] text-muted">🔔 {t('ok.notify')}</p>
            )}
          </motion.div>

          <motion.div className="mb-auto mt-7 flex w-full max-w-sm flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <button className="btn-primary w-full" onClick={() => close('orders')}>{t('ok.track')}</button>
            <button className="w-full py-3 text-[14px] font-semibold text-muted" onClick={() => close('menu')}>{t('ok.toMenu')}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
