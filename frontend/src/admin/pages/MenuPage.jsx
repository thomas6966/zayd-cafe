// Menyu boshqaruvi (CRUD): kategoriya va mahsulotlar
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { moneySum } from '../../lib/format.js';
import { ErrorText, Field, FormButtons, Loading, Modal, PageTitle, Toggle, useApi } from '../ui.jsx';

function ProductForm({ product, categoryId, categories, onClose, onSaved }) {
  const [f, setF] = useState({
    name: product?.name || '', description: product?.description || '', price: product?.price ?? '',
    imageUrl: product?.imageUrl || '', categoryId: product?.categoryId || categoryId, isAvailable: product?.isAvailable ?? true,
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (!f.name.trim() || f.price === '' || Number(f.price) < 0) return setErr("Nom va narxni to'g'ri kiriting");
    setBusy(true); setErr('');
    try {
      const body = { ...f, price: Number(f.price) };
      if (product) await api.put(`/api/admin/products/${product.id}`, body);
      else await api.post('/api/admin/products', body);
      onSaved();
    } catch (e) { setErr(e.message); setBusy(false); }
  };
  const remove = async () => {
    if (!confirm(`"${product.name}" o'chirilsinmi?`)) return;
    try { await api.del(`/api/admin/products/${product.id}`); onSaved(); } catch (e) { setErr(e.message); }
  };

  return (
    <Modal open onClose={onClose} title={product ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}>
      <div className="grid gap-4">
        <Field label="Nomi"><input className="field" value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Narxi (so'm)"><input className="field" type="number" min="0" value={f.price} onChange={set('price')} /></Field>
          <Field label="Kategoriya">
            <select className="field" value={f.categoryId} onChange={set('categoryId')}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Tavsif"><input className="field" value={f.description} onChange={set('description')} /></Field>
        <Field label="Rasm havolasi" hint="/menu/... yoki https://... manzil">
          <input className="field" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://…" />
        </Field>
        {f.imageUrl && <img src={f.imageUrl} alt="" className="h-32 w-full rounded-xl object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
        <Toggle label="Sotuvda mavjud" checked={f.isAvailable} onChange={(v) => setF({ ...f, isAvailable: v })} />
        {err && <ErrorText>{err}</ErrorText>}
        <div className="flex items-center justify-between gap-2">
          {product ? <button className="btn btn-danger" onClick={remove}>🗑 O'chirish</button> : <span />}
          <FormButtons onCancel={onClose} onSave={save} busy={busy} />
        </div>
      </div>
    </Modal>
  );
}

function CategoryForm({ category, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '');
  const [emoji, setEmoji] = useState(category?.emoji || '🍽️');
  const [err, setErr] = useState('');
  const save = async () => {
    if (!name.trim()) return setErr('Nom kerak');
    try {
      if (category) await api.put(`/api/admin/categories/${category.id}`, { name, emoji });
      else await api.post('/api/admin/categories', { name, emoji });
      onSaved();
    } catch (e) { setErr(e.message); }
  };
  const remove = async () => {
    if (!confirm(`"${category.name}" va undagi barcha mahsulotlar o'chiriladi. Davom etasizmi?`)) return;
    try { await api.del(`/api/admin/categories/${category.id}`); onSaved(); } catch (e) { setErr(e.message); }
  };
  return (
    <Modal open onClose={onClose} title={category ? 'Kategoriya' : 'Yangi kategoriya'}>
      <div className="grid gap-4">
        <Field label="Emoji"><input className="field" value={emoji} onChange={(e) => setEmoji(e.target.value)} /></Field>
        <Field label="Nomi"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {err && <ErrorText>{err}</ErrorText>}
        <div className="flex items-center justify-between gap-2">
          {category ? <button className="btn btn-danger" onClick={remove}>🗑 O'chirish</button> : <span />}
          <FormButtons onCancel={onClose} onSave={save} />
        </div>
      </div>
    </Modal>
  );
}

export default function MenuPage() {
  const { data: menu, error, load } = useApi('/api/admin/menu');
  const [form, setForm] = useState(null);
  const [localErr, setLocalErr] = useState('');
  const [q, setQ] = useState('');

  const toggle = async (p) => {
    try { await api.put(`/api/admin/products/${p.id}`, { isAvailable: !p.isAvailable }); load(); } catch (e) { setLocalErr(e.message); }
  };
  const toggleCat = async (c) => {
    try { await api.put(`/api/admin/categories/${c.id}`, { isActive: !c.isActive }); load(); } catch (e) { setLocalErr(e.message); }
  };
  const saved = () => { setForm(null); load(); };

  if (error && !menu) return <ErrorText>{error}</ErrorText>;
  if (!menu) return <Loading />;
  const needle = q.trim().toLowerCase();

  return (
    <div>
      <PageTitle right={<>
        <input className="field !w-56" placeholder="🔍 Qidirish…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => setForm({ type: 'category' })}>+ Kategoriya</button>
        <button className="btn-primary !rounded-xl !py-2.5 !text-sm" onClick={() => setForm({ type: 'product', categoryId: menu[0]?.id })}>+ Mahsulot</button>
      </>}>Menyu</PageTitle>
      {(localErr || error) && <ErrorText>{localErr || error}</ErrorText>}

      {menu.map((c) => {
        const products = needle ? c.products.filter((p) => p.name.toLowerCase().includes(needle)) : c.products;
        if (needle && products.length === 0) return null;
        return (
          <section key={c.id} className="card mb-5 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
              <h2 className={`flex-1 font-display text-xl font-bold ${c.isActive ? '' : 'opacity-50'}`}>{c.emoji} {c.name} <span className="text-sm font-normal text-muted">· {c.products.length}</span></h2>
              <Toggle label={c.isActive ? 'Faol' : 'Yashirin'} checked={c.isActive} onChange={() => toggleCat(c)} />
              <button className="btn" onClick={() => setForm({ type: 'category', category: c })}>✏️</button>
              <button className="btn" onClick={() => setForm({ type: 'product', categoryId: c.id })}>+</button>
            </div>
            <table className="w-full">
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={p.isAvailable ? '' : 'opacity-55'}>
                    <td className="w-16">
                      <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-surface-2">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : c.emoji}
                      </div>
                    </td>
                    <td><p className="font-bold">{p.name}</p>{p.description && <p className="text-xs text-muted">{p.description}</p>}</td>
                    <td className="font-bold text-gold">{moneySum(p.price)}</td>
                    <td><Toggle label="" checked={p.isAvailable} onChange={() => toggle(p)} /></td>
                    <td className="text-right"><button className="btn" onClick={() => setForm({ type: 'product', product: p })}>✏️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <p className="p-5 text-sm text-muted">Mahsulotlar yo'q</p>}
          </section>
        );
      })}

      {form?.type === 'product' && <ProductForm product={form.product} categoryId={form.categoryId} categories={menu} onClose={() => setForm(null)} onSaved={saved} />}
      {form?.type === 'category' && <CategoryForm category={form.category} onClose={() => setForm(null)} onSaved={saved} />}
    </div>
  );
}
