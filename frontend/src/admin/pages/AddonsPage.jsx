// Pullik qo'shimchalar (sirop, qo'shimcha pishloq va h.k.)
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { money } from '../../lib/format.js';
import { Actions, Empty, ErrorText, Field, FormButtons, Loading, Modal, PageTitle, Toggle, useApi } from '../ui.jsx';

export default function AddonsPage() {
  const { data: rows, error, load } = useApi('/api/admin/addons');
  const { data: menu } = useApi('/api/admin/menu');
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');

  const catName = (id) => menu?.find((c) => c.id === id);

  const submit = async () => {
    setErr('');
    if (!edit.name.trim()) return setErr('Nomi kerak');
    try {
      const body = { ...edit, price: Number(edit.price) || 0 };
      if (edit.id) await api.put(`/api/admin/addons/${edit.id}`, body);
      else await api.post('/api/admin/addons', body);
      setEdit(null); load();
    } catch (e) { setErr(e.message); }
  };
  const remove = async (a) => {
    if (!confirm(`"${a.name}" o'chirilsinmi?`)) return;
    try { await api.del(`/api/admin/addons/${a.id}`); load(); } catch (e) { alert(e.message); }
  };

  if (!rows) return error ? <ErrorText>{error}</ErrorText> : <Loading />;

  return (
    <div>
      <PageTitle right={<button className="btn-primary !rounded-xl !py-2.5 !text-sm" onClick={() => setEdit({ name: '', nameRu: '', price: 0, categoryIds: [], isActive: true })}>+ Yangi qo'shimcha</button>}>Qo'shimchalar</PageTitle>
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Pullik qo'shimchalar (qo'shimcha shot, sirop, pishloq, bekon…). Har biri faqat tanlangan kategoriyalardagi taomlarda, mijoz mahsulotni ochganda ko'rinadi va narxga qo'shiladi.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead><tr><th>Nomi</th><th>Narx</th><th>Kategoriyalar</th><th>Holat</th><th /></tr></thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><p className="font-bold">{a.name}</p>{a.nameRu && <p className="text-xs text-muted">{a.nameRu}</p>}</td>
                <td className="font-bold text-gold">+{money(a.price)} so'm</td>
                <td className="text-sm text-muted">{a.categoryIds.map((id) => catName(id)?.name).filter(Boolean).join(', ') || '—'}</td>
                <td><span className={`badge ${a.isActive ? 'bg-ok/20 text-ok' : 'bg-cream/10 text-muted'}`}>{a.isActive ? 'Faol' : "O'chiq"}</span></td>
                <Actions onEdit={() => setEdit({ ...a })} onDelete={() => remove(a)} />
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty>Qo'shimchalar yo'q</Empty>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? "Qo'shimchani tahrirlash" : "Yangi qo'shimcha"}>
        {edit && (
          <div className="grid gap-4">
            <Field label="Nomi (O'zbekcha)"><input className="field" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Nomi (Ruscha)"><input className="field" value={edit.nameRu} onChange={(e) => setEdit({ ...edit, nameRu: e.target.value })} /></Field>
            <Field label="Qo'shimcha narx (so'm)"><input className="field" type="number" min="0" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></Field>
            <div>
              <span className="mb-2 block text-[12px] font-bold uppercase tracking-wider text-muted">Qaysi kategoriyalarda ko'rinadi</span>
              <div className="flex flex-wrap gap-2">
                {menu?.map((c) => {
                  const on = edit.categoryIds.includes(c.id);
                  return (
                    <button key={c.id} type="button" onClick={() => setEdit({ ...edit, categoryIds: on ? edit.categoryIds.filter((x) => x !== c.id) : [...edit.categoryIds, c.id] })}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${on ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted'}`}>{c.emoji} {c.name}</button>
                  );
                })}
              </div>
            </div>
            <Toggle label="Faol" checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} />
            {err && <ErrorText>{err}</ErrorText>}
            <FormButtons onCancel={() => setEdit(null)} onSave={submit} />
          </div>
        )}
      </Modal>
    </div>
  );
}
