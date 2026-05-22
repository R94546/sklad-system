import { useEffect, useState } from 'react';
import { Plus, Edit, Power } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Select, Modal, Table, Badge } from '../components/ui';

const ROLE_OPTIONS = [{ value: 'SELLER', label: 'Sotuvchi' }, { value: 'ADMIN', label: 'Admin' }];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '', role: 'SELLER' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', phone: '', password: '', role: 'SELLER' }); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, phone: u.phone, password: '', role: u.role }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form };
      if (editing && !data.password) delete data.password;
      if (editing) { await api.put('/users/' + editing.id, data); toast.success('Yangilandi'); }
      else { await api.post('/users', data); toast.success('Yaratildi'); }
      setModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const handleToggle = async (u) => {
    try {
      await api.put('/users/' + u.id, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Ochirildi' : 'Yoqildi');
      load();
    } catch { toast.error('Xatolik'); }
  };

  const columns = [
    { title: 'Ism', key: 'name', render: (v) => <span className="font-medium text-gray-800">{v}</span> },
    { title: 'Telefon', key: 'phone', render: (v) => <span className="text-gray-500">{v}</span> },
    { title: 'Rol', key: 'role', align: 'center', render: (v) => <Badge variant={v === 'ADMIN' ? 'purple' : 'blue'}>{v === 'ADMIN' ? 'Admin' : 'Sotuvchi'}</Badge> },
    { title: 'Holat', key: 'isActive', align: 'center', render: (v) => <Badge variant={v ? 'green' : 'red'}>{v ? 'Faol' : 'Nofaol'}</Badge> },
    { title: 'Amallar', key: 'id', align: 'center', render: (v, row) => (
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => openEdit(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={15} /></button>
        <button onClick={() => handleToggle(row)} className={'p-1.5 rounded-lg transition-colors ' + (row.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50')}><Power size={15} /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Foydalanuvchilar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <Table columns={columns} data={users} loading={loading} emptyText="Foydalanuvchilar topilmadi" />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Tahrirlash' : 'Yangi foydalanuvchi'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Ism" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+998901234567" required />
          <Input label={editing ? 'Yangi parol (ixtiyoriy)' : 'Parol'} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
          <Select label="Rol" value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={ROLE_OPTIONS} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}