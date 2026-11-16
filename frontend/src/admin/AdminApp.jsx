// Admin panel (/admin): yon panelli dashboard. Kirish: Telegram ID ro'yxati yoki PIN.
import { useEffect, useState } from 'react';
import { api, adminPin } from '../lib/api.js';
import { ThemeToggle } from '../components/ui.jsx';
import AddonsPage from './pages/AddonsPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import PromosPage from './pages/PromosPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import StatsPage from './pages/StatsPage.jsx';

const PAGES = [
  { id: 'orders', label: 'Buyurtmalar', icon: '🧾', el: OrdersPage },
  { id: 'stats', label: 'Statistika', icon: '📊', el: StatsPage },
  { id: 'menu', label: 'Menyu', icon: '🍽️', el: MenuPage },
  { id: 'addons', label: "Qo'shimchalar", icon: '➕', el: AddonsPage },
  { id: 'promos', label: 'Promo-kodlar', icon: '🏷️', el: PromosPage },
  { id: 'customers', label: 'Mijozlar', icon: '👥', el: CustomersPage },
  { id: 'settings', label: 'Sozlamalar', icon: '⚙️', el: SettingsPage },
];

function Login({ onOk, denied }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    adminPin.set(pin);
    try { await api.get('/api/admin/me'); onOk(); }
    catch (err) { adminPin.clear(); setError(err.status === 403 ? "PIN noto'g'ri" : err.message); }
  };
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <form onSubmit={submit} className="card w-full max-w-sm p-8 text-center">
        <img src="/logo.png" className="mx-auto h-28 w-28 rounded-full" alt="" />
        <h1 className="mt-5 font-display text-3xl font-bold">Admin panel</h1>
        <p className="mt-1 text-sm text-muted">{denied ? "Telegram ID admin ro'yxatida yo'q. PIN kiriting." : 'ZAYD Cafe'}</p>
        <input className="field mt-6 text-center" type="password" inputMode="numeric" autoFocus placeholder="PIN kod" value={pin} onChange={(e) => setPin(e.target.value)} />
        {error && <p className="mt-3 text-sm font-semibold text-bad">{error}</p>}
        <button className="btn-primary mt-4 w-full" disabled={!pin}>Kirish</button>
      </form>
    </div>
  );
}

export default function AdminApp() {
  const [auth, setAuth] = useState('checking'); // checking | ok | denied | error
  const [err, setErr] = useState('');
  const [page, setPage] = useState(() => { try { return localStorage.getItem('zayd_admin_page') || 'orders'; } catch { return 'orders'; } });
  const [newCount, setNewCount] = useState(0);

  const check = () =>
    api.get('/api/admin/me').then(() => setAuth('ok'))
      .catch((e) => { if (e.status === 403 || e.status === 401) setAuth('denied'); else { setErr(e.message); setAuth('error'); } });
  useEffect(() => { check(); }, []);
  useEffect(() => { try { localStorage.setItem('zayd_admin_page', page); } catch { /* ignore */ } }, [page]);

  if (auth === 'checking') return <p className="p-10 text-center text-muted">Tekshirilmoqda…</p>;
  if (auth === 'error') return <div className="p-10 text-center text-bad">{err}<br /><button onClick={check} className="btn-primary mt-4">Qayta urinish</button></div>;
  if (auth === 'denied') return <Login denied onOk={() => setAuth('ok')} />;

  const Current = PAGES.find((p) => p.id === page)?.el || OrdersPage;
  const logout = () => { adminPin.clear(); check(); };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface p-4 md:flex">
        <div className="flex items-center gap-3 px-2 pb-6 pt-2">
          <img src="/logo.png" alt="" className="h-14 w-14 rounded-full" />
          <div>
            <p className="font-display text-xl font-bold leading-tight">ZAYD</p>
            <p className="text-xs text-muted">Admin dashboard</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {PAGES.map((p) => (
            <button key={p.id} onClick={() => setPage(p.id)}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[14.5px] font-bold transition-colors ${page === p.id ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-cream/5'}`}>
              <span className="text-lg">{p.icon}</span>
              {p.label}
              {p.id === 'orders' && newCount > 0 && <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-black text-on-accent">{newCount}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-4 flex items-center gap-2">
          <ThemeToggle size={42} />
          <button className="btn flex-1" onClick={logout}>Chiqish</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 flex items-center gap-1 overflow-x-auto border-b border-line bg-surface p-2 md:hidden">
          <img src="/logo.png" alt="" className="mr-1 h-8 w-8 shrink-0 rounded-full" />
          {PAGES.map((p) => (
            <button key={p.id} onClick={() => setPage(p.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${page === p.id ? 'bg-accent/15 text-accent' : 'text-muted'}`}>
              {p.icon} {p.label}{p.id === 'orders' && newCount > 0 ? ` (${newCount})` : ''}
            </button>
          ))}
          <div className="ml-auto pl-2"><ThemeToggle size={34} /></div>
        </div>
        <main className="mx-auto max-w-[1400px] p-4 md:p-8"><Current onNew={setNewCount} /></main>
      </div>
    </div>
  );
}
