// Admin panel UI bloklari
import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm anim-fade"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`card my-6 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} p-6 shadow-2xl`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="font-display text-2xl font-bold">{title}</h3>
          <button className="text-xl text-muted hover:text-cream" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-bold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-2.5 text-sm font-semibold">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-ok' : 'bg-cream/20'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label}
    </button>
  );
}

export function PageTitle({ children, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-[30px] font-bold">{children}</h1>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  );
}

export const Empty = ({ children }) => <p className="p-10 text-center text-muted">{children}</p>;
export const Loading = () => <p className="text-muted">Yuklanmoqda…</p>;
export const ErrorText = ({ children }) => <p className="mb-3 text-sm font-semibold text-bad">{children}</p>;

export const Actions = ({ onEdit, onDelete }) => (
  <td className="whitespace-nowrap text-right">
    <button className="btn mr-2" onClick={onEdit}>✏️</button>
    <button className="btn btn-danger" onClick={onDelete}>🗑</button>
  </td>
);

export const FormButtons = ({ onCancel, onSave, busy }) => (
  <div className="flex justify-end gap-2 pt-1">
    <button className="btn" onClick={onCancel}>Bekor qilish</button>
    <button className="btn-primary !rounded-xl !py-2.5 !text-sm" disabled={busy} onClick={onSave}>Saqlash</button>
  </div>
);

// GET so'rovini yuklaydigan yordamchi hook
export function useApi(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setData(await api.get(path)); setError(''); } catch (e) { setError(e.message); }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, error, load };
}
