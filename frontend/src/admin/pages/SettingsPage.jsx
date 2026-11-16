// Sozlamalar: yetkazish narxi, minimal buyurtma
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Field, Loading, PageTitle } from '../ui.jsx';

const FIELDS = [
  ['deliveryFee', "Yetkazib berish narxi (so'm)", '0 — yetkazish bepul'],
  ['freeDeliveryFrom', "Shu summadan boshlab yetkazish bepul (so'm)", '0 — o\'chiq'],
  ['minOrder', "Minimal buyurtma summasi (so'm)", "0 — cheklov yo'q"],
];

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState({ text: '', ok: true });

  useEffect(() => { api.get('/api/admin/settings').then(setS).catch((e) => setMsg({ text: e.message, ok: false })); }, []);
  if (!s) return msg.text ? <p className="text-bad">{msg.text}</p> : <Loading />;

  const submit = async () => {
    try { setS(await api.put('/api/admin/settings', s)); setMsg({ text: '✓ Saqlandi', ok: true }); }
    catch (e) { setMsg({ text: e.message, ok: false }); }
  };

  return (
    <div>
      <PageTitle>Sozlamalar</PageTitle>
      <div className="card max-w-2xl p-6">
        <div className="grid gap-5">
          {FIELDS.map(([key, label, hint]) => (
            <Field key={key} label={label} hint={hint}>
              <input className="field" type="number" min="0" value={s[key]} onChange={(e) => setS({ ...s, [key]: e.target.value })} />
            </Field>
          ))}
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button className="btn-primary !rounded-xl !py-2.5 !text-sm" onClick={submit}>Saqlash</button>
          {msg.text && <span className={`text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}
