// Promo-kodlar
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { money } from '../../lib/format.js';
import { Actions, Empty, ErrorText, Field, FormButtons, Loading, Modal, PageTitle, Toggle, useApi } from '../ui.jsx';

const NEW = { code: '', type: 'PERCENT', value: 10, minOrder: 0, maxUses: '', isActive: true, expiresAt: '' };

export default function PromosPage() {
  const { data: rows, error, load } = useApi('/api/admin/promos');
  const [edit, setEdit] = useState(null);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!edit.code.trim()) return setErr('Kodni kiriting');
    try {
      const body = { ...edit, value: Number(edit.value), minOrder: Number(edit.minOrder) || 0, maxUses: edit.maxUses === '' ? null : Number(edit.maxUses) };
      if (edit.id) await api.put(`/api/admin/promos/${edit.id}`, body);
      else await api.post('/api/admin/promos', body);
      setEdit(null); load();
    } catch (e) { setErr(e.message); }
  };
  const remove = async (p) => {
    if (!confirm(`${p.code} o'chirilsinmi?`)) return;
    try { await api.del(`/api/admin/promos/${p.id}`); load(); } catch (e) { alert(e.message); }
  };
  const toggle = async (p) => { try { await api.put(`/api/admin/promos/${p.id}`, { isActive: !p.isActive }); load(); } catch (e) { alert(e.message); } };

  if (!rows) return error ? <ErrorText>{error}</ErrorText> : <Loading />;
  const expired = (p) => p.expiresAt && new Date(p.expiresAt) < new Date();

  return (
    <div>
      <PageTitle right={<button className="btn-primary !rounded-xl !py-2.5 !text-sm" onClick={() => setEdit({ ...NEW })}>+ Yangi promo-kod</button>}>Promo-kodlar</PageTitle>
      <p className="mb-4 max-w-2xl text-sm text-muted">Mijoz savatda promo-kodni kiritadi va chegirma shu zahoti hisoblanadi. Kod bir necha marta ishlatilishi, muddati va minimal summasi bo'lishi mumkin.</p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead><tr><th>Kod</th><th>Chegirma</th><th>Min. summa</th><th>Ishlatilgan</th><th>Muddati</th><th>Holat</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="font-mono font-extrabold tracking-wider">{p.code}</td>
                <td className="font-bold text-gold">{p.type === 'PERCENT' ? `${p.value}%` : `${money(p.value)} so'm`}</td>
                <td>{p.minOrder ? money(p.minOrder) : '—'}</td>
                <td>{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                <td className={expired(p) ? 'text-bad' : 'text-muted'}>{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('uz-UZ') : 'Cheksiz'}{expired(p) && ' (tugagan)'}</td>
                <td><Toggle label="" checked={p.isActive} onChange={() => toggle(p)} /></td>
                <Actions onEdit={() => setEdit({ ...p, maxUses: p.maxUses ?? '', expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : '' })} onDelete={() => remove(p)} />
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty>Promo-kodlar yo'q</Empty>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Promo-kodni tahrirlash' : 'Yangi promo-kod'}>
        {edit && (
          <div className="grid gap-4">
            <Field label="Kod"><input className="field font-mono uppercase" value={edit.code} onChange={(e) => setEdit({ ...edit, code: e.target.value.toUpperCase() })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Turi">
                <select className="field" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>
                  <option value="PERCENT">Foiz (%)</option>
                  <option value="FIXED">Aniq summa (so'm)</option>
                </select>
              </Field>
              <Field label={edit.type === 'PERCENT' ? 'Foiz' : "Summa (so'm)"}><input className="field" type="number" min="1" value={edit.value} onChange={(e) => setEdit({ ...edit, value: e.target.value })} /></Field>
              <Field label="Minimal buyurtma (so'm)"><input className="field" type="number" min="0" value={edit.minOrder} onChange={(e) => setEdit({ ...edit, minOrder: e.target.value })} /></Field>
              <Field label="Maksimal ishlatilish" hint="Bo'sh — cheksiz"><input className="field" type="number" min="1" value={edit.maxUses} onChange={(e) => setEdit({ ...edit, maxUses: e.target.value })} /></Field>
            </div>
            <Field label="Amal qilish muddati" hint="Bo'sh — cheksiz"><input className="field" type="date" value={edit.expiresAt} onChange={(e) => setEdit({ ...edit, expiresAt: e.target.value })} /></Field>
            <Toggle label="Faol" checked={edit.isActive} onChange={(v) => setEdit({ ...edit, isActive: v })} />
            {err && <ErrorText>{err}</ErrorText>}
            <FormButtons onCancel={() => setEdit(null)} onSave={submit} />
          </div>
        )}
      </Modal>
    </div>
  );
}
