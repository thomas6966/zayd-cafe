import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { money, moneySum } from '../../lib/format.js';
import { ErrorText, Loading, PageTitle } from '../ui.jsx';

function Stat({ label, value, sub, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="mt-2 text-[28px] font-extrabold leading-none">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export default function StatsPage() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => api.get('/api/admin/stats').then(setS).catch((e) => setError(e.message));
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  if (error) return <ErrorText>{error}</ErrorText>;
  if (!s) return <Loading />;

  const max = Math.max(1, ...s.days.map((d) => d.revenue));
  const dayName = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('uz-UZ', { weekday: 'short', day: 'numeric' });
  const topMax = Math.max(1, ...s.top.map((t) => t.quantity));

  return (
    <div>
      <PageTitle>Statistika</PageTitle>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat icon="🧾" label="Bugungi buyurtmalar" value={s.todayOrders} />
        <Stat icon="💰" label="Bugungi tushum" value={money(s.todayRevenue)} sub="so'm (bekor qilinganlarsiz)" />
        <Stat icon="🔥" label="Faol buyurtmalar" value={s.activeOrders} sub="hozir jarayonda" />
        <Stat icon="👥" label="Mijozlar" value={s.customers} sub="botdan foydalanganlar" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat icon="📅" label="Haftalik tushum" value={money(s.weekRevenue)} sub="oxirgi 7 kun, so'm" />
        <Stat icon="📦" label="Haftalik buyurtmalar" value={s.weekOrders} />
        <Stat icon="🧮" label="O'rtacha chek" value={money(s.avgOrder)} sub="so'm" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-5 text-sm font-extrabold uppercase tracking-wider text-muted">Oxirgi 7 kun tushumi</h2>
          <div className="flex h-56 items-end gap-2 sm:gap-3">
            {s.days.map((d) => (
              <div key={d.date} className="flex h-full flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-muted">{d.revenue ? money(Math.round(d.revenue / 1000)) + 'k' : ''}</span>
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-accent-deep to-accent transition-all"
                    style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} title={`${d.orders} ta buyurtma · ${moneySum(d.revenue)}`} />
                </div>
                <span className="text-[11px] font-semibold text-muted">{dayName(d.date)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-muted">Eng ko'p sotilgan (7 kun)</h2>
          {s.top.length === 0 && <p className="text-sm text-muted">Ma'lumot yo'q</p>}
          <ol className="space-y-3.5">
            {s.top.map((t, i) => (
              <li key={t.name} className="text-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-xs font-black text-accent">{i + 1}</span>
                  <span className="flex-1 font-semibold">{t.name}</span>
                  <span className="font-extrabold text-gold">{t.quantity} ta</span>
                </div>
                <div className="ml-10 mt-1.5 h-1.5 rounded-full bg-cream/10"><div className="h-full rounded-full bg-accent" style={{ width: `${(t.quantity / topMax) * 100}%` }} /></div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
