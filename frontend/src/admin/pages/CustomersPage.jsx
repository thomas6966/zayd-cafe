// Mijozlar ro'yxati
import { useState } from 'react';
import { money } from '../../lib/format.js';
import { Empty, ErrorText, Loading, PageTitle, useApi } from '../ui.jsx';

export default function CustomersPage() {
  const { data: rows, error } = useApi('/api/admin/customers');
  const [q, setQ] = useState('');
  if (!rows) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const needle = q.trim().toLowerCase();
  const list = needle ? rows.filter((u) => `${u.firstName} ${u.lastName || ''} ${u.username || ''} ${u.phone || ''}`.toLowerCase().includes(needle)) : rows;

  return (
    <div>
      <PageTitle right={<input className="field !w-64" placeholder="🔍 Ism, @username, telefon…" value={q} onChange={(e) => setQ(e.target.value)} />}>Mijozlar</PageTitle>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead><tr><th>Ism</th><th>Telegram</th><th>Telefon</th><th>Buyurtmalar</th><th>Sarflagan</th><th>Qo'shilgan</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="font-bold">{u.firstName} {u.lastName || ''}</td>
                <td className="text-muted">{u.username ? <a className="underline" href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">@{u.username}</a> : u.telegramId}</td>
                <td>{u.phone || '—'}</td>
                <td>{u.ordersCount}</td>
                <td className="font-bold text-gold">{money(u.spent)} so'm</td>
                <td className="text-muted">{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <Empty>Mijozlar topilmadi</Empty>}
      </div>
    </div>
  );
}
