import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Badge } from '../components/ui';
import printJS from 'print-js';

const PAYMENT_LABELS = { CASH: 'Naqd', CARD: 'Karta', DEBT: 'Nasiya', MIXED: 'Aralash' };
const STATUS = { COMPLETED: { label: 'Bajarildi', variant: 'green' }, CANCELLED: { label: 'Bekor', variant: 'red' }, RETURNED: { label: 'Qaytarildi', variant: 'yellow' } };

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/sales/' + id).then(r => setSale(r.data.data)),
      api.get('/settings').then(r => setSettings(r.data.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    printJS({
      printable: 'receipt',
      type: 'html',
      style: `
        body { font-family: monospace; font-size: 12px; width: 280px; margin: 0 auto; }
        h2 { text-align: center; font-size: 16px; margin-bottom: 4px; }
        p { text-align: center; margin: 2px 0; font-size: 11px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        table { width: 100%; font-size: 11px; }
        td { padding: 2px 0; }
        .right { text-align: right; }
        .total { font-weight: bold; font-size: 13px; }
      `,
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!sale) return <div className="text-center py-20 text-slate-400 dark:text-slate-500">Topilmadi</div>;

  const subtotal = sale.items?.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/sales')} className="p-2 hover:bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-slate-800 flex-1">Sotuv #{sale.id.slice(-6).toUpperCase()}</h1>
        <Button onClick={handlePrint} variant="outline"><Printer size={16} /> Chek chiqarish</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Sana</span>
          <span className="font-medium">{new Date(sale.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Sotuvchi</span>
          <span className="font-medium">{sale.user?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Mijoz</span>
          <span className="font-medium">{sale.client?.name || '-'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Tolov turi</span>
          <Badge variant="blue">{PAYMENT_LABELS[sale.paymentType]}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Holat</span>
          <Badge variant={STATUS[sale.status]?.variant}>{STATUS[sale.status]?.label}</Badge>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b bg-slate-50 dark:bg-slate-700/50">
          <h2 className="font-semibold text-slate-700 dark:text-slate-300">Mahsulotlar</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th className="px-5 py-2 text-left text-xs text-slate-500 dark:text-slate-400">Nomi</th>
              <th className="px-5 py-2 text-right text-xs text-slate-500 dark:text-slate-400">Miqdor</th>
              <th className="px-5 py-2 text-right text-xs text-slate-500 dark:text-slate-400">Narx</th>
              <th className="px-5 py-2 text-right text-xs text-slate-500 dark:text-slate-400">Jami</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sale.items?.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-700/50">
                <td className="px-5 py-3 font-medium">{item.product?.name}</td>
                <td className="px-5 py-3 text-right text-slate-500 dark:text-slate-400">{item.quantity}</td>
                <td className="px-5 py-3 text-right">{Number(item.price).toLocaleString()}</td>
                <td className="px-5 py-3 text-right font-bold">{(Number(item.price) * item.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t space-y-2 bg-slate-50 dark:bg-slate-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Jami</span>
            <span>{subtotal.toLocaleString()} so'm</span>
          </div>
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Skidka</span>
              <span className="text-red-500">-{Number(sale.discount).toLocaleString()} so'm</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Tolov summasi</span>
            <span className="text-indigo-600 dark:text-indigo-400">{Number(sale.totalAmount).toLocaleString()} so'm</span>
          </div>
        </div>
      </div>

      <div id="receipt" className="hidden">
        <h2>{settings?.companyName || 'Sklad'}</h2>
        <p>{settings?.companyPhone || ''}</p>
        <p>{settings?.companyAddress || ''}</p>
        <div className="divider"></div>
        <p>Sana: {new Date(sale.createdAt).toLocaleString()}</p>
        <p>Chek: #{sale.id.slice(-6).toUpperCase()}</p>
        {sale.client && <p>Mijoz: {sale.client.name}</p>}
        <div className="divider"></div>
        <table>
          <tbody>
            {sale.items?.map(item => (
              <tr key={item.id}>
                <td>{item.product?.name}</td>
                <td className="right">{item.quantity} x {Number(item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="divider"></div>
        {Number(sale.discount) > 0 && <p>Skidka: -{Number(sale.discount).toLocaleString()} so'm</p>}
        <p className="total">JAMI: {Number(sale.totalAmount).toLocaleString()} so'm</p>
        <p>Tolov: {PAYMENT_LABELS[sale.paymentType]}</p>
        <div className="divider"></div>
        <p>Xarid uchun rahmat!</p>
      </div>
    </div>
  );
}


