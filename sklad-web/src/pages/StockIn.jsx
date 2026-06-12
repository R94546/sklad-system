import { useEffect, useState } from 'react';
import { Plus, Scan, Pencil, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table } from '../components/ui';
import BarcodeScanner from '../components/BarcodeScanner';
import ViewToggle from '../components/ViewToggle';
import { getSavedView, saveView } from '../utils/viewPref';
import useBarcodeScanner from '../hooks/useBarcodeScanner';

const UNITS = { PIECE: 'шт', KG: 'кг', METER: 'м', LITER: 'л', BOX: 'кор' };

export default function StockIn() {
  const [stockins, setStockins] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [form, setForm] = useState({ productId: '', quantity: '', price: '', note: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useState(() => getSavedView('stockin', 'list'));

  const changeView = (v) => { setView(v); saveView('stockin', v); };

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

  // Сканер-пистолет: открывает форму прихода и подставляет товар по штрихкоду
  useBarcodeScanner((code) => {
    if (!modal) {
      setEditing(null);
      setForm({ productId: '', quantity: '', price: '', note: '' });
      setSelectedProduct(null);
      setModal(true);
    }
    handleScan(code);
  }, { enabled: !editing });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put('/stockin/' + editing.id, { quantity: form.quantity, price: form.price, note: form.note });
        toast.success('Приход обновлён');
      } else {
        await api.post('/stockin', form);
        toast.success('Приход оформлен');
      }
      setModal(false);
      setEditing(null);
      setForm({ productId: '', quantity: '', price: '', note: '' });
      setSelectedProduct(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
    setSaving(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ productId: '', quantity: '', price: '', note: '' });
    setSelectedProduct(null);
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ productId: row.productId, quantity: String(row.quantity), price: String(row.price), note: row.note || '' });
    setSelectedProduct(row.product || null);
    setModal(true);
  };

  const doDelete = async () => {
    const id = confirmDel.id;
    setConfirmDel(null);
    try { await api.delete('/stockin/' + id); toast.success('Приход удалён'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Ошибка'); }
  };

  const productOptions = products.map(p => ({ value: p.id, label: p.name + ' (остаток: ' + p.quantity + ')' }));

  const columns = [
    { title: 'Дата', key: 'createdAt', render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString('ru-RU')}</span> },
    { title: 'Товар', key: 'product', render: (v) => <span className="font-medium">{v?.name}</span> },
    { title: 'Кол-во', key: 'quantity', align: 'right', render: (v, row) => <span className="font-medium text-green-600">+{v} {UNITS[row.product?.unit] || row.product?.unit}</span> },
    { title: 'Цена', key: 'price', align: 'right', render: (v) => <span>{Number(v).toLocaleString('ru-RU')} сом</span> },
    { title: 'Итого', key: 'price', align: 'right', render: (v, row) => <span className="font-bold">{(Number(v) * row.quantity).toLocaleString('ru-RU')} сом</span> },
    { title: 'Кто', key: 'user', render: (v) => <span className="text-slate-500 dark:text-slate-400">{v?.name}</span> },
    { title: 'Заметка', key: 'note', render: (v) => <span className="text-gray-400 text-xs">{v || '-'}</span> },
    { title: '', key: 'id', align: 'right', render: (_, row) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => openEdit(row)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="Изменить"><Pencil size={15} /></button>
        <button onClick={() => setConfirmDel(row)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Удалить"><Trash2 size={15} /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Приход товара</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={changeView} />
          <Button onClick={openCreate}><Plus size={16} /> Оформить приход</Button>
        </div>
      </div>

      {view === 'list' ? (
        <Table columns={columns} data={stockins} loading={loading} emptyText="Приходов нет" />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse" />)}
        </div>
      ) : stockins.length === 0 ? (
        <p className="text-center text-slate-400 py-12">Приходов нет</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {stockins.map(row => (
            <div key={row.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2">{row.product?.name}</p>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button onClick={() => openEdit(row)} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="Изменить"><Pencil size={14} /></button>
                  <button onClick={() => setConfirmDel(row)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg" title="Удалить"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm font-medium text-green-600">+{row.quantity} {UNITS[row.product?.unit] || row.product?.unit} · {Number(row.price).toLocaleString('ru-RU')} сом</p>
              <p className="text-sm font-bold text-slate-800 dark:text-white">{(Number(row.price) * row.quantity).toLocaleString('ru-RU')} сом</p>
              <p className="text-[11px] text-slate-400">{new Date(row.createdAt).toLocaleDateString('ru-RU')} · {row.user?.name}{row.note ? ' · ' + row.note : ''}</p>
            </div>
          ))}
        </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? 'Изменить приход' : 'Новый приход'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Товар</label>
            {editing ? (
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                {selectedProduct?.name || '—'}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кол-во" type="number" step="any" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Input label="Цена прихода" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
          </div>
          <Input label="Заметка" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setModal(false); setEditing(null); }}>Отмена</Button>
            <Button type="submit" className="flex-1" loading={saving}>Сохранить</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} title="Удалить приход?" size="sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Остаток товара уменьшится на {confirmDel?.quantity} {UNITS[confirmDel?.product?.unit] || confirmDel?.product?.unit}. Если товар уже продан — удаление будет отклонено.
        </p>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDel(null)}>Отмена</Button>
          <Button type="button" variant="danger" className="flex-1" onClick={doDelete}>Удалить</Button>
        </div>
      </Modal>
    </div>
  );
}
