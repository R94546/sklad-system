import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { X, Package } from "lucide-react";
import api from "../api/axios";
import { Badge } from "../components/ui";

const STATUS = { COMPLETED: { label: "Bajarildi", variant: "green" }, CANCELLED: { label: "Bekor", variant: "red" }, RETURNED: { label: "Qaytarildi", variant: "yellow" } };
const PAYMENT_LABELS = { CASH: "Naqd", CARD: "Karta", DEBT: "Nasiya", MIXED: "Aralash" };

function ProductModal({ product, onClose }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mahsulot</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover" /> : <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Package size={28} className="text-slate-400" /></div>}
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{product.name}</p>
              <p className="text-sm text-slate-400">{product.category?.name}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Sotish narxi</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{Number(product.sellPrice).toLocaleString()} som</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Kirim narxi</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{Number(product.buyPrice).toLocaleString()} som</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Qoldiq</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{product.quantity} {product.unit}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Foyda (1 dona)</p>
              <p className="font-bold text-emerald-600 text-sm">{(Number(product.sellPrice)-Number(product.buyPrice)).toLocaleString()} som</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SaleDetailModal({ sale, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!sale) return;
    setLoading(true);
    api.get("/sales/" + sale.id).then(r => setDetail(r.data.data)).finally(() => setLoading(false));
  }, [sale]);
  if (!sale) return null;
  const s = detail || sale;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Sotuv tafsiloti</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Mijoz</p><p className="font-medium text-slate-800 dark:text-white text-sm">{s.client?.name || "Noaniq"}</p></div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Sotuvchi</p><p className="font-medium text-slate-800 dark:text-white text-sm">{s.user?.name}</p></div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Tolov</p><Badge variant="blue">{PAYMENT_LABELS[s.paymentType]}</Badge></div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Holat</p><Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge></div>
                <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Sana</p><p className="font-medium text-slate-800 dark:text-white text-sm">{new Date(s.createdAt).toLocaleString()}</p></div>
                <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3"><p className="text-xs text-slate-400 mb-1">Jami</p><p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{Number(s.totalAmount).toLocaleString()} som</p></div>
              </div>
              {s.items && s.items.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mahsulotlar</p>
                  <div className="space-y-2">
                    {s.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                        <div><p className="font-medium text-slate-800 dark:text-white">{item.product?.name}</p><p className="text-xs text-slate-400">{item.quantity} x {Number(item.price).toLocaleString()} som</p></div>
                        <p className="font-bold text-slate-800 dark:text-white">{(item.quantity * Number(item.price)).toLocaleString()} som</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SellerModal({ seller, onClose }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  useEffect(() => {
    if (!seller) return;
    setLoading(true);
    api.get("/sales?limit=100").then(r => {
      setSales(r.data.data.data.filter(s => s.user?.name === seller.name));
    }).finally(() => setLoading(false));
  }, [seller]);
  if (!seller) return null;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{seller.name}</h2>
              <p className="text-xs text-slate-400">{seller.count} ta sotuv · {Number(seller.totalAmount).toLocaleString()} som</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            {loading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
            : sales.length === 0 ? <p className="text-center text-slate-400 py-8">Sotuvlar yoq</p>
            : <div className="space-y-2">
                {sales.map(s => (
                  <div key={s.id} onClick={() => setSelectedSale(s)} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600">
                    <div><p className="font-medium text-slate-800 dark:text-white text-sm">{s.client?.name || "Noaniq"}</p><p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString()} · {PAYMENT_LABELS[s.paymentType]}</p></div>
                    <div className="text-right"><p className="font-bold text-slate-800 dark:text-white text-sm">{Number(s.totalAmount).toLocaleString()} som</p><Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge></div>
                  </div>
                ))}
              </div>}
          </div>
        </div>
      </div>
      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </>
  );
}

export default function Analytics() {
  const [chart, setChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [topProfit, setTopProfit] = useState([]);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [productDetail, setProductDetail] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/analytics/sales-chart?period=" + period).then(r => setChart(r.data.data)),
      api.get("/analytics/top-products").then(r => setTopProducts(r.data.data)),
      api.get("/analytics/sellers").then(r => setSellers(r.data.data)),
      api.get("/analytics/top-profit").then(r => setTopProfit(r.data.data)),
    ]).finally(() => setLoading(false));
  }, [period]);

  const openProduct = async (name) => {
    try {
      const r = await api.get("/products?search=" + encodeURIComponent(name));
      const found = r.data.data.data[0];
      if (found) setProductDetail(found);
    } catch {}
  };

  const periods = [
    { value: "week", label: "Hafta" },
    { value: "month", label: "Oy" },
    { value: "year", label: "Yil" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analitika</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Sotuv va mahsulot statistikasi</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 animate-fade-in-up delay-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Sotuvlar grafigi</h2>
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            {periods.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={"px-3 py-1.5 rounded-md text-sm font-medium transition-none " + (period === p.value ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"K" : v} />
            <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#1E293B", color: "#F1F5F9", fontSize: "12px" }} cursor={{ stroke: "#4F46E5", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 animate-fade-in-up delay-200">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Top mahsulotlar</h2>
          {topProducts.length === 0 ? <p className="text-slate-400 text-center py-8 text-sm">Malumot yoq</p> : (
            <div className="space-y-3">
              {(() => { const max = Math.max(...topProducts.map(p => p.totalAmount)); return topProducts.map((p, i) => (
                <div key={i} className="cursor-pointer" onClick={() => openProduct(p.name)}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[60%] hover:text-indigo-600 dark:hover:text-indigo-400">{p.name}</span>
                    <span className="text-slate-500 dark:text-slate-400">{Number(p.totalAmount).toLocaleString()} som</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: (p.totalAmount / max * 100) + "%" }} />
                  </div>
                </div>
              )); })()}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 animate-fade-in-up delay-300">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Sotuvchilar reytingi</h2>
          {sellers.length === 0 ? <p className="text-slate-400 text-center py-8 text-sm">Malumot yoq</p> : (
            <div className="space-y-2">
              {sellers.map((s, i) => (
                <div key={i} onClick={() => setSelectedSeller(s)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                  <div className={"w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm " + (i === 0 ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600" : i === 1 ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" : "bg-orange-100 dark:bg-orange-500/10 text-orange-600")}>{i + 1}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.count} ta sotuv</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{Number(s.totalAmount).toLocaleString()} som</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 animate-fade-in-up delay-300">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Foyda boyicha top mahsulotlar</h2>
        {topProfit.length === 0 ? <p className="text-slate-400 text-center py-8 text-sm">Malumot yoq</p> : (
          <div className="space-y-3">
            {(() => { const max = Math.max(...topProfit.filter(p => p.profit > 0).map(p => p.profit), 1); return topProfit.filter(p => p.profit > 0).map((p, i) => (
              <div key={i} className="cursor-pointer" onClick={() => openProduct(p.name)}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[60%] hover:text-emerald-600 dark:hover:text-emerald-400">{p.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{Number(p.profit).toLocaleString()} som</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: (p.profit / max * 100) + "%" }} />
                </div>
              </div>
            )); })()}
          </div>
        )}
      </div>

      <SellerModal seller={selectedSeller} onClose={() => setSelectedSeller(null)} />
      <ProductModal product={productDetail} onClose={() => setProductDetail(null)} />
    </div>
  );
}
