import { useEffect, useState } from 'react';
import { Plus, Edit, Ban } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Table, Badge } from '../components/ui';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clients?search=' + search);
      setClients(res.data.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: '', phone: '', address: '', note: '' }); setModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address || '', note: c.note || '' }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put('/clients/' + editing.id, form); toast.success('Yangilandi'); }
      else { await api.post('/clients', form); toast.success('Yaratildi'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const handleBlock = async (c) => {
    try {
      await api.patch('/clients/' + c.id + '/block', { isBlocked: !c.isBlocked });
      toast.success(c.isBlocked ? 'Blokdan chiqarildi' : 'Bloklandi');
      load();
    } catch { toast.error('Xatolik'); }
  };

  const columns = [
    { title: 'Ism', key: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { title: 'Telefon', key: 'phone', render: (v) => <span className="text-gray-500">{v}</span> },
    { title: 'Manzil', key: 'address', render: (v) => <span className="text-gray-500">{v || '-'}</span> },
    { title: 'Holat', key: 'isBlocked', align: 'center', render: (v) => (
      <Badge variant={v ? 'red' : 'green'}>{v ? 'Bloklangan' : 'Faol'}</Badge>
    )},
    { title: 'Amallar', key: 'id', align: 'center', render: (v, row) => (
      <div className="flex items-center justify-center gap-2">
        <a href={'/clients/' + v} className="p-1.5 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-xs font-medium">Ko'rish →</a>
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
        <button onClick={() => handleBlock(row)} className={'p-1.5 rounded-lg transition-colors ' + (row.isBlocked ? 'text-green-500 hover:bg-green-50' : 'text-red-500 hover:bg-red-50')}><Ban size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Mijozlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <Input placeholder="Ism yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />

      <Table columns={columns} data={clients} loading={loading} emptyText="Mijozlar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Mijozni tahrirlash' : 'Yangi mijoz'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Ism familiya" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+998901234567" required />
          <Input label="Manzil" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Izoh</label>
            <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}