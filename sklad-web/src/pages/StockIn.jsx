import { useEffect, useState } from 'react';
import { Plus, Scan } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';

export default function StockIn() {
  const [stockins, setStockins] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', price: '', note: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stockin');
      setStockins(res.data.data.data);
    } catch { toast.error('Ошибка'); }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    api.get('/products?limit=1000').then(r => setProducts(r.data.data.data));
  }, []);

  const handleScan = async (barcode) => {
    setShowScanner(false);
    try {
      const res = await api.get('/barcode/scan/' + barcode);
      const product = res.data.data;
      setSelectedProduct(product);
      setForm(f => ({ ...f, productId: product.id, price: product.buyPrice }));
      toast.success(product.name + ' найден');
    } catch {
      toast.error('Товар не найден: ' + barcode);
    }
  };

  const handleProductChange = (e) => {
    const product = products.find(p => p.id === e.target.value);
    setSelectedProduct(product || null);
    setForm(f => ({ ...f, productId: e.target.value, price: product?.buyPrice || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/stockin', form);
      toast.success('Приход оформлен');
      setModal(false);
      setForm({ productId: '', quantity: '', price: '', note: '' });
      setSelectedProduct(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    setSaving(false);
  };

  const openModal = () => {
    setForm({ productId: '', quantity: '', price: '', note: '' });
    setSelectedProduct(null);
    setModal(true);
  };

  const productOptions = products.map(p => ({ value: p.id, label: p.name + ' (остаток: ' + p.quantity + ')' }));

  const columns = [
    { title: 'Дата', key: 'createdAt', render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString('ru-RU')}</span> },
    { title: 'Товар', key: 'product', render: (v) => <span className="font-medium">{v?.name}</span> },
    { title: 'Кол-во', key: 'quantity', align: 'right', render: (v, row) => <span className="font-medium text-green-600">+{v} {row.product?.unit}</span> },
    { title: 'Цена', key: 'price', align: 'right', render: (v) => <span>{Number(v).toLocaleString('ru-RU')} сом</span> },
    { title: 'Итого', key: 'price', align: 'right', render: (v, row) => <span className="font-bold">{(Number(v) * row.quantity).toLocaleString('ru-RU')} сом</span> },
    { title: 'Кто', key: 'user', render: (v) => <span className="text-slate-500 dark:text-slate-400">{v?.name}</span> },
    { title: 'Заметка', key: 'note', render: (v) => <span className="text-gray-400 text-xs">{v || '-'}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Приход товара</h1>
        <Button onClick={openModal}><Plus size={16} /> Оформить приход</Button>
      </div>

      <Table columns={columns} data={stockins} loading={loading} emptyText="Приходов нет" />

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <Modal open={modal} onClose={() => setModal(false)} title="Новый приход">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Товар</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={form.productId} onChange={handleProductChange} options={productOptions} placeholder="Выберите товар" required />
              </div>
              <Button type="button" variant="outline" onClick={() => setShowScanner(true)} title="Сканер штрихкода">
                <Scan size={16} />
              </Button>
            </div>
            {selectedProduct && (
              <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{selectedProduct.name}</span>
                <span className="text-xs text-indigo-500">Остаток: {selectedProduct.quantity}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кол-во" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Input label="Цена прихода" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          </div>
          <Input label="Заметка" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Отмена</Button>
            <Button type="submit" className="flex-1" loading={saving}>Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
