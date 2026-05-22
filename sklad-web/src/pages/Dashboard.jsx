import { useEffect, useState } from 'react';
import { ShoppingCart, Users, CreditCard, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={'p-3 rounded-xl ' + bg}>
      <Icon size={22} className={color} />
    </div>
    <div>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-800 mt-0.5">{value}</p>
    </div>
  </div>
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    api.get('/analytics/dashboard').then(r => setData(r.data.data)).catch(() => toast.error('Xatolik'));
    api.get('/analytics/sales-chart?period=week').then(r => setChart(r.data.data));
    api.get('/sales?limit=5').then(r => setRecentSales(r.data.data.data));
    api.get('/products?limit=5').then(r => {
      const low = r.data.data.data.filter(p => p.quantity <= p.minStock);
      setLowStock(low);
    });
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Bugungi sotuv" value={Number(data.today.amount).toLocaleString() + " so'm"} bg="bg-blue-50" color="text-blue-600" />
        <StatCard icon={TrendingUp} label="Oylik sotuv" value={Number(data.month.amount).toLocaleString() + " so'm"} bg="bg-green-50" color="text-green-600" />
        <StatCard icon={CreditCard} label="Umumiy qarz" value={Number(data.totalDebt).toLocaleString() + " so'm"} bg="bg-red-50" color="text-red-600" />
        <StatCard icon={Users} label="Mijozlar" value={data.totalClients} bg="bg-purple-50" color="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Haftalik sotuvlar</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1) + 'M' : v >= 1000 ? (v/1000).toFixed(0) + 'K' : v} />              <Tooltip formatter={v => [v.toLocaleString() + " so'm", 'Sotuv']} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-base font-semibold text-gray-700">Kam qoldiq</h2>
              {data.lowStockCount > 0 && <span className="ml-auto bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-medium">{data.lowStockCount} ta</span>}
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Hammasi yetarli</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{p.name}</span>
                    <span className="text-red-500 font-medium">{p.quantity} {p.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} className="text-blue-500" />
              <h2 className="text-base font-semibold text-gray-700">Oxirgi sotuvlar</h2>
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sotuvlar yoq</p>
            ) : (
              <div className="space-y-2">
                {recentSales.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{s.client?.name || 'Noaniq'}</span>
                    <span className="font-medium text-gray-800">{Number(s.totalAmount).toLocaleString()} so'm</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}