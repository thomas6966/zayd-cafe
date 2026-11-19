// Sozlamalar: yetkazish narxi, minimal buyurtma
import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { Field, Loading, PageTitle } from '../ui.jsx';

const FIELDS = [
  ['deliveryFee', "Yetkazib berish narxi (so'm)", "Odatda 0 qoldiring: yetkazib berishni Yandex amalga oshiradi, narxini Yandex tarifi belgilaydi va mijoz kuryerga alohida to'laydi. Aniq narx kiritsangiz, u buyurtma summasiga qo'shiladi."],
  ['minOrder', "Minimal buyurtma summasi (so'm)", "0 — cheklov yo'q"],
];

export default function SettingsPage() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState({ text: '', ok: true });

  useEffect(() => { api.get('/api/admin/settings').then(setS).catch((e) => setMsg({ text: e.message, ok: false })); }, []);
  if (!s) return msg.text ? <p className="text-bad">{msg.text}</p> : <Loading />;

  const submit = async () => {
    const digits = String(s.cardNumber || '').replace(/\D/g, '');
    if (digits && digits.length !== 16) return setMsg({ text: "Karta raqami 16 ta raqam bo'lishi kerak", ok: false });
    try { setS(await api.put('/api/admin/settings', { ...s, cardNumber: String(s.cardNumber || '').replace(/\D/g, '') })); setMsg({ text: '✓ Saqlandi', ok: true }); }
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
        <h2 className="mb-1 mt-8 font-display text-xl font-bold">Onlayn to'lov (karta)</h2>
        <p className="mb-4 text-sm text-muted">Mijoz Payme yoki Click orqali shu kartaga o'tkazma qiladi. Karta raqami bo'sh bo'lsa, onlayn to'lov mijozga ko'rinmaydi.</p>
        <div className="grid gap-5">
          <Field label="Karta raqami" hint="16 raqam, masalan 8600 1234 5678 9012">
            <input className="field font-mono" inputMode="numeric" maxLength={23} value={s.cardNumber || ''} onChange={(e) => setS({ ...s, cardNumber: e.target.value })} />
          </Field>
          <Field label="Karta egasi (ism familiya)">
            <input className="field" value={s.cardHolder || ''} onChange={(e) => setS({ ...s, cardHolder: e.target.value })} />
          </Field>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <button className="btn-primary !rounded-xl !py-2.5 !text-sm" onClick={submit}>Saqlash</button>
          {msg.text && <span className={`text-sm font-semibold ${msg.ok ? 'text-ok' : 'text-bad'}`}>{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}
