import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input, Modal, Table, Badge } from '../components/ui';
import { exportToExcel } from '../utils/export';
import { Download } from 'lucide-react';

const STATUS = { PENDING: { label: 'Kutilmoqda', variant: 'yellow' }, PAID: { label: 'Tolangan', variant: 'green' }, OVERDUE: { label: 'Muddati otgan', variant: 'red' } };

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/debts');
      setDebts(res.data.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openPay = (d) => { setSelected(d); setAmount(''); setPayModal(true); };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.patch('/debts/' + selected.id + '/pay', { amount: Number(amount) });
      toast.success('Tolov qabul qilindi');
      setPayModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Xatolik'); }
    setPaying(false);
  };

  const filtered = debts.filter(d =>
    d.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.client?.phone?.includes(search)
  );

  const columns = [
    { title: 'Mijoz', key: 'client', render: (v) => <span className="font-medium text-gray-800">{v?.name}</span> },
    { title: 'Telefon', key: 'client', render: (v) => <span className="text-gray-500">{v?.phone}</span> },
    { title: 'Summa', key: 'amount', align: 'right', render: (v) => <span className="font-medium">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Tolangan', key: 'paid', align: 'right', render: (v) => <span className="text-green-600">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Qoldiq', key: 'amount', align: 'right', render: (v, row) => <span className="text-red-500 font-medium">{(Number(v) - Number(row.paid)).toLocaleString()} so'm</span> },
    { title: 'Muddat', key: 'dueDate', align: 'center', render: (v) => <span className="text-gray-500 text-xs">{new Date(v).toLocaleDateString()}</span> },
    { title: 'Holat', key: 'status', align: 'center', render: (v) => <Badge variant={STATUS[v]?.variant}>{STATUS[v]?.label}</Badge> },
    { title: 'Amal', key: 'id', align: 'center', render: (v, row) => (
      row.status !== 'PAID' && (
        <button onClick={() => openPay(row)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
          <DollarSign size={15} />
        </button>
      )
    )},
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Nasiyalar</h1>
        <Button variant="outline" onClick={() => exportToExcel(filtered, [
          { title: 'Mijoz', key: 'client', getValue: r => r.client?.name },
          { title: 'Telefon', key: 'client', getValue: r => r.client?.phone },
          { title: 'Summa', key: 'amount', getValue: r => Number(r.amount) },
          { title: 'Tolangan', key: 'paid', getValue: r => Number(r.paid) },
          { title: 'Qoldiq', getValue: r => Number(r.amount) - Number(r.paid) },
          { title: 'Muddat', key: 'dueDate', getValue: r => new Date(r.dueDate).toLocaleDateString() },
          { title: 'Holat', key: 'status', getValue: r => r.status },
        ], 'nasiyalar')}><Download size={16} /> Excel</Button>
      </div>

      <Input placeholder="Mijoz ismi yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />

      <Table columns={columns} data={filtered} loading={loading} emptyText="Nasiyalar topilmadi" />

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Tolov qabul qilish" size="sm">
        {selected && (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="font-medium text-gray-800">{selected.client?.name}</p>
              <p className="text-sm text-gray-500">{selected.client?.phone}</p>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500">Qoldiq:</span>
                <span className="font-bold text-red-500">{(Number(selected.amount) - Number(selected.paid)).toLocaleString()} so'm</span>
              </div>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <Input label="Tolov summasi" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Summani kiriting" required />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setPayModal(false)}>Bekor</Button>
                <Button type="submit" className="flex-1" loading={paying}>Tasdiqlash</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}