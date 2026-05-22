import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table, Badge } from '../components/ui';

const UNITS = { PIECE: 'dona', KG: 'kg', METER: 'metr', LITER: 'litr', BOX: 'quti' };
const UNIT_OPTIONS = Object.entries(UNITS).map(([value, label]) => ({ value, label }));

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', buyPrice: '', sellPrice: '', quantity: '', minStock: 10, unit: 'PIECE' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products?search=' + search);
      setProducts(res.data.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { api.get('/categories').then(r => setCategories(r.data.data)); }, []);
  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', categoryId: '', buyPrice: '', sellPrice: '', quantity: '', minStock: 10, unit: 'PIECE' }); setModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, categoryId: p.categoryId, buyPrice: p.buyPrice, sellPrice: p.sellPrice, quantity: p.quantity, minStock: p.minStock, unit: p.unit }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put('/products/' + editing.id, form); toast.success('Yangilandi'); }
      else { await api.post('/products', form); toast.success('Yaratildi'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ochirmoqchimisiz?')) return;
    try { await api.delete('/products/' + id); toast.success('Ochirildi'); load(); }
    catch { toast.error('Xatolik'); }
  };

  const columns = [
    { title: 'Nomi', key: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { title: 'Kategoriya', key: 'category', render: (v) => <span className="text-gray-500">{v?.name}</span> },
    { title: 'Sotish narxi', key: 'sellPrice', align: 'right', render: (v) => <span className="font-medium">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Kirim narxi', key: 'buyPrice', align: 'right', render: (v) => <span className="text-gray-500">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Qoldiq', key: 'quantity', align: 'right', render: (v, row) => (
      <Badge variant={v <= row.minStock ? 'red' : 'green'}>{v} {UNITS[row.unit]}</Badge>
    )},
    { title: 'Amallar', key: 'id', align: 'center', render: (v, row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
        <button onClick={() => handleDelete(v)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mahsulotlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} />

      <Table columns={columns} data={products} loading={loading} emptyText="Mahsulotlar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nomi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Select label="Kategoriya" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} options={categoryOptions} placeholder="Kategoriya tanlang" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kirim narxi" type="number" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} required />
            <Input label="Sotish narxi" type="number" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Miqdor" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Select label="Birlik" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} options={UNIT_OPTIONS} />
          </div>
          <Input label="Minimal qoldiq" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}