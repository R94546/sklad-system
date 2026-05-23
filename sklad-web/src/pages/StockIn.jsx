import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table } from '../components/ui';

export default function StockIn() {
  const [stockins, setStockins] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', price: '', note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stockin');
      setStockins(res.data.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/products').then(r => setProducts(r.data.data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stockin', form);
      toast.success('Kirim amalga oshirildi');
      setModal(false);
      setForm({ productId: '', quantity: '', price: '', note: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const productOptions = products.map(p => ({ value: p.id, label: p.name + ' (qoldiq: ' + p.quantity + ')' }));

  const columns = [
    { title: 'Sana', key: 'createdAt', render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString()}</span> },
    { title: 'Mahsulot', key: 'product', render: (v) => <span className="font-medium">{v?.name}</span> },
    { title: 'Miqdor', key: 'quantity', align: 'right', render: (v, row) => <span className="font-medium text-green-600">+{v} {row.product?.unit}</span> },
    { title: 'Narx', key: 'price', align: 'right', render: (v) => <span>{Number(v).toLocaleString()} so'm</span> },
    { title: 'Jami', key: 'price', align: 'right', render: (v, row) => <span className="font-bold">{(Number(v) * row.quantity).toLocaleString()} so'm</span> },
    { title: 'Kim', key: 'user', render: (v) => <span className="text-slate-500 dark:text-slate-400">{v?.name}</span> },
    { title: 'Izoh', key: 'note', render: (v) => <span className="text-gray-400 text-xs">{v || '-'}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Mahsulot kirimi</h1>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Kirim qilish</Button>
      </div>

      <Table columns={columns} data={stockins} loading={loading} emptyText="Kirimlar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi kirim">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Mahsulot" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} options={productOptions} placeholder="Mahsulot tanlang" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Miqdor" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Input label="Kirim narxi" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          </div>
          <Input label="Izoh" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


