import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, MapPin, Ban } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Badge, Table } from '../components/ui';

const PAYMENT_LABELS = { CASH: 'Naqd', CARD: 'Karta', DEBT: 'Nasiya', MIXED: 'Aralash' };
const DEBT_STATUS = { PENDING: { label: 'Kutilmoqda', variant: 'yellow' }, PAID: { label: 'Tolangan', variant: 'green' }, OVERDUE: { label: 'Muddati otgan', variant: 'red' } };

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get('/clients/' + id);
      setClient(res.data.data);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleBlock = async () => {
    try {
      await api.patch('/clients/' + id + '/block', { isBlocked: !client.isBlocked });
      toast.success(client.isBlocked ? 'Blokdan chiqarildi' : 'Bloklandi');
      load();
    } catch { toast.error('Xatolik'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!client) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Topilmadi</div>;

  const totalPurchase = client.sales?.reduce((sum, s) => sum + Number(s.totalAmount), 0) || 0;
  const totalDebt = client.debts?.filter(d => d.status !== 'PAID').reduce((sum, d) => sum + (Number(d.amount) - Number(d.paid)), 0) || 0;

  const saleColumns = [
    { title: 'Sana', key: 'createdAt', render: (v) => <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(v).toLocaleDateString()}</span> },
    { title: 'Summa', key: 'totalAmount', align: 'right', render: (v) => <span className="font-medium">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Tolov', key: 'paymentType', align: 'center', render: (v) => <Badge variant="blue">{PAYMENT_LABELS[v]}</Badge> },
    { title: '', key: 'id', align: 'center', render: (v) => <a href={'/sales/' + v} className="text-indigo-500 dark:text-indigo-400 text-xs hover:underline">Ko'rish в†’</a> },
  ];

  const debtColumns = [
    { title: 'Summa', key: 'amount', render: (v) => <span className="font-medium">{Number(v).toLocaleString()} so'm</span> },
    { title: 'Qoldiq', key: 'amount', align: 'right', render: (v, row) => <span className="text-red-500 font-medium">{(Number(v) - Number(row.paid)).toLocaleString()} so'm</span> },
    { title: 'Muddat', key: 'dueDate', align: 'center', render: (v) => <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(v).toLocaleDateString()}</span> },
    { title: 'Holat', key: 'status', align: 'center', render: (v) => <Badge variant={DEBT_STATUS[v]?.variant}>{DEBT_STATUS[v]?.label}</Badge> },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-2 hover:bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex-1">{client.name}</h1>
        <Button variant={client.isBlocked ? 'outline' : 'danger'} onClick={handleBlock}>
          <Ban size={16} /> {client.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {client.name?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{client.name}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
              <Phone size={14} />
              <span>{client.phone}</span>
            </div>
            {client.address && (
              <div className="flex items-center gap-2 text-gray-500 text-sm mt-0.5">
                <MapPin size={14} />
                <span>{client.address}</span>
              </div>
            )}
          </div>
          <div className="ml-auto">
            <Badge variant={client.isBlocked ? 'red' : 'green'}>{client.isBlocked ? 'Bloklangan' : 'Faol'}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{client.sales?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Xaridlar</p>
          </div>
          <div className="text-center border-x">
            <p className="text-2xl font-bold text-green-600">{totalPurchase.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Jami xarid (so'm)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{totalDebt.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Qarz qoldig'i (so'm)</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-semibold text-slate-700 dark:text-slate-300">Oxirgi xaridlar</h2>
        </div>
        <Table columns={saleColumns} data={client.sales || []} emptyText="Xaridlar topilmadi" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-semibold text-slate-700 dark:text-slate-300">Nasiyalar</h2>
        </div>
        <Table columns={debtColumns} data={client.debts || []} emptyText="Nasiyalar topilmadi" />
      </div>
    </div>
  );
}


