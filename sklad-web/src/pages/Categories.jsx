import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Table } from '../components/ui';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setName(''); setModal(true); };
  const openEdit = (c) => { setEditing(c); setName(c.name); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Nom kiriting');
    setSaving(true);
    try {
      if (editing) { await api.put('/categories/' + editing.id, { name }); toast.success('Yangilandi'); }
      else { await api.post('/categories', { name }); toast.success('Yaratildi'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Ochirmoqchimisiz?')) return;
    try { await api.delete('/categories/' + id); toast.success('Ochirildi'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
  };

  const columns = [
    { title: 'Nomi', key: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { title: 'Amallar', key: 'id', align: 'center', render: (v, row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
        <button onClick={() => handleDelete(v)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Kategoriyalar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <Table columns={columns} data={categories} loading={loading} emptyText="Kategoriyalar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Tahrirlash' : 'Yangi kategoriya'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Kategoriya nomi" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}