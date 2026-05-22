import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table, Badge } from '../components/ui';
import { exportToExcel, exportToPDF } from '../utils/export';
import { Download } from 'lucide-react';

const PAYMENT_LABELS = { CASH: 'Naqd', CARD: 'Karta', DEBT: 'Nasiya', MIXED: 'Aralash' };
const PAYMENT_OPTIONS = Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }));
const STATUS = { COMPLETED: { label: 'Bajarildi', variant: 'green' }, CANCELLED: { label: 'Bekor', variant: 'red' }, RETURNED: { label: 'Qaytarildi', variant: 'yellow' } };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ paymentType: 'CASH', clientId: '', dueDate: '', debtAmount: '', discount: 0, items: [] });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      setSales(res.data.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get('/products').then(r => setProducts(r.data.data.data));
    api.get('/clients').then(r => setClients(r.data.data.data));
  }, []);

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name + ' (' + c.phone + ')' }));

  const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, price: '' }] });

  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    if (field === 'productId') {
      const p = products.find(p => p.id === value);
      if (p) items[i].price = p.sellPrice;
    }
    setForm({ ...form, items });
  };

  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const total = form.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 0)), 0);
  const finalTotal = total - Number(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) return toast.error('Mahsulot qoshing');
    setSaving(true);
    try {
      await api.post('/sales', { ...form, discount: Number(form.discount || 0) });
      toast.success('Sotuv amalga oshirildi');
      setModal(false);
      setForm({ paymentType: 'CASH', clientId: '', dueDate: '', debtAmount: '', discount: 0, items: [] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const filtered = sales.filter(s =>
    s.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { title: 'Sana', key: 'createdAt', render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString()}</span> },
    { title: 'Mijoz', key: 'client', render: (v) => <span className="font-medium">{v?.name || '-'}</span> },
    { title: 'Sotuvchi', key: 'user', render: (v) => <span className="text-gray-500">{v?.name}</span> },
    { title: 'Summa', key: 'totalAmount', align: 'right', render: (v) => <span className="font-bold text-gray-800">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Tolov', key: 'paymentType', align: 'center', render: (v) => <Badge variant="blue">{PAYMENT_LABELS[v]}</Badge> },
    { title: 'Holat', key: 'status', align: 'center', render: (v) => <Badge variant={STATUS[v]?.variant}>{STATUS[v]?.label}</Badge> },
    { title: '', key: 'id', align: 'center', render: (v) => (
      <a href={'/sales/' + v} className="text-blue-500 hover:text-blue-700 text-xs font-medium">Ko'rish →</a>
    )},
  ];


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sotuvlar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(filtered, [
            { title: 'Sana', key: 'createdAt', getValue: r => new Date(r.createdAt).toLocaleDateString() },
            { title: 'Mijoz', key: 'client', getValue: r => r.client?.name || '-' },
            { title: 'Sotuvchi', key: 'user', getValue: r => r.user?.name },
            { title: 'Summa', key: 'totalAmount', getValue: r => Number(r.totalAmount) },
            { title: 'Tolov', key: 'paymentType', getValue: r => PAYMENT_LABELS[r.paymentType] },
          ], 'sotuvlar')}><Download size={16} /> Excel</Button>
          <Button onClick={() => setModal(true)}><Plus size={16} /> Yangi sotuv</Button>
        </div>
      </div>

      <Input placeholder="Mijoz yoki sotuvchi..." value={search} onChange={e => setSearch(e.target.value)} />

      <Table columns={columns} data={filtered} loading={loading} emptyText="Sotuvlar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi sotuv" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tolov turi" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
            <Select label="Mijoz" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} options={clientOptions} placeholder="Tanlang" />
          </div>

          {(form.paymentType === 'DEBT' || form.paymentType === 'MIXED') && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nasiya muddati" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
              {form.paymentType === 'MIXED' && (
                <Input label="Nasiya summasi" type="number" value={form.debtAmount} onChange={e => setForm({...form, debtAmount: e.target.value})} placeholder="Nasiya qismi" required />
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Mahsulotlar</label>
              <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:underline font-medium">+ Qoshish</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Mahsulot tanlang</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity})</option>)}
                  </select>
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} min="1" required className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Miqdor" />
                  <input type="number" value={item.price} onChange={e => updateItem(i, 'price', e.target.value)} required className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Narx" />
                  <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <Input label="Skidka (so'm)" type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Jami</p>
              <p className="text-xl font-bold text-blue-600">{finalTotal.toLocaleString()} so'm</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Sotish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}