import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';
import { Badge } from '../components/ui';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export default function Analytics() {
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/sales-chart?period=' + period).then(r => setChart(r.data.data)),
      api.get('/analytics/top-products').then(r => setTopProducts(r.data.data)),
      api.get('/analytics/sellers').then(r => setSellers(r.data.data)),
    ]).finally(() => setLoading(false));
  }, [period]);

  const periods = [
    { value: 'week', label: 'Hafta' },
    { value: 'month', label: 'Oy' },
    { value: 'year', label: 'Yil' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analitika</h1>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-700">Sotuvlar grafigi</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {periods.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={'px-3 py-1.5 rounded-md text-sm font-medium transition-all ' + (period === p.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chart} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(0)+'K' : v} />
            <Tooltip formatter={v => [v.toLocaleString() + " so'm", 'Sotuv']} cursor={{ fill: '#f3f4f6' }} />
            <Bar dataKey="amount" fill="#3b82f6" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Top mahsulotlar</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Malumot yoq</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={topProducts} dataKey="totalSold" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={40}>
                  {topProducts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(v) => <span style={{fontSize:12}}>{v}</span>} />
                <Tooltip formatter={(v, n) => [v + ' ta', n]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Sotuvchilar reytingi</h2>
          {sellers.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">Malumot yoq</p>
          ) : (
            <div className="space-y-3">
              {sellers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ' + (i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600')}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.count} ta sotuv</p>
                  </div>
                  <Badge variant="green">{Number(s.totalAmount).toLocaleString()} so'm</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}