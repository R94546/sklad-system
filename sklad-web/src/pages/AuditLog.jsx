import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Table, Badge } from '../components/ui';

const ACTIONS = {
  CREATE: { label: 'Yaratildi', variant: 'green' },
  UPDATE: { label: 'Yangilandi', variant: 'blue' },
  DELETE: { label: 'Ochirildi', variant: 'red' },
  LOGIN: { label: 'Kirdi', variant: 'purple' },
  LOGOUT: { label: 'Chiqdi', variant: 'gray' },
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit?page=' + page + '&limit=' + limit);
      setLogs(res.data.data.data);
      setTotal(res.data.data.total);
    } catch { toast.error('Xatolik'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const totalPages = Math.ceil(total / limit);

  const columns = [
    { title: 'Sana', key: 'createdAt', render: (v) => <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(v).toLocaleString()}</span> },
    { title: 'Foydalanuvchi', key: 'user', render: (v) => <span className="font-medium">{v?.name}</span> },
    { title: 'Amal', key: 'action', render: (v) => <Badge variant={ACTIONS[v]?.variant || 'gray'}>{ACTIONS[v]?.label || v}</Badge> },
    { title: 'Ob\'ekt', key: 'entity', render: (v) => <span className="text-slate-500 dark:text-slate-400">{v}</span> },
    { title: 'ID', key: 'entityId', render: (v) => <span className="text-xs text-gray-400 font-mono">{v ? v.slice(-8) : '-'}</span> },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Audit log</h1>

      <Table columns={columns} data={logs} loading={loading} emptyText="Loglar topilmadi" />

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 px-4 py-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">Jami: {total} ta yozuv</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Oldingi</button>
            <span className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-slate-50 dark:bg-slate-700/50 disabled:opacity-50">Keyingi</button>
          </div>
        </div>
      )}
    </div>
  );
}


