import { useEffect, useState } from "react";
import { ShoppingCart, Users, CreditCard, Package, TrendingUp, AlertTriangle, X, ArrowRight, ExternalLink, Boxes, Wallet, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import { DashboardSkeleton } from "../components/Skeleton";
import { Badge } from "../components/ui";
import useAuthStore from "../store/authStore";

const STATUS = { COMPLETED: { label: "Оформлен", variant: "green" }, CANCELLED: { label: "Отменён", variant: "red" }, RETURNED: { label: "Возврат", variant: "yellow" }, PENDING: { label: "Корзина", variant: "blue" } };
const STATUS_DEBT = { PENDING: { label: "Ожидает", variant: "yellow" }, PAID: { label: "Оплачен", variant: "green" }, OVERDUE: { label: "Просрочен", variant: "red" } };

function QuickModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

const Trend = ({ value }) => {
  if (value == null || !isFinite(value)) return null;
  const up = value >= 0;
  return <span className={"text-[11px] font-semibold " + (up ? "text-emerald-500" : "text-red-500")}>{up ? "▲" : "▼"} {Math.abs(value).toFixed(0)}%</span>;
};

const StatCard = ({ icon: Icon, label, value, sub, trend, color, bg, delay = "", onClick, show = true }) => {
  if (!show) return null;
  return (
    <div onClick={onClick} className={"bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4 transition-none hover:shadow-md animate-fade-in-up " + (onClick ? "cursor-pointer " : "") + delay}>
      <div className={"p-3 rounded-xl " + bg}><Icon size={22} className={color} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{value}</p>
        {(sub || trend != null) && (
          <div className="flex items-center gap-2 mt-0.5">
            {trend != null && <Trend value={trend} />}
            {sub && <span className="text-[11px] text-slate-400 truncate">{sub}</span>}
          </div>
        )}
      </div>
      {onClick && <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [modal, setModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === "ADMIN";

  useEffect(() => {
    if (!authUser) return;
    const endpoint = isAdmin ? "/analytics/dashboard" : "/analytics/seller-dashboard";
    api.get(endpoint).then(r => setData(r.data.data)).catch(() => setData({ today: { amount: 0 }, month: { amount: 0 }, totalDebt: 0, lowStockCount: 0, totalClients: 0 }));
    api.get("/analytics/sales-chart?period=week").then(r => setChart(r.data.data)).catch(() => {});
    api.get("/sales?limit=5").then(r => setRecentSales(r.data.data.data)).catch(() => {});
    if (isAdmin) {
      api.get("/analytics/low-stock").then(r => setLowStock(r.data.data || [])).catch(() => {});
    }
  }, [authUser, isAdmin]);

  const openModal = async (type) => {
    setModal(type);
    setModalLoading(true);
    setModalData([]);
    try {
      if (type === "today") { const r = await api.get("/sales?limit=50"); setModalData(r.data.data.data.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())); }
      if (type === "month") { const r = await api.get("/sales?limit=200"); const now = new Date(); setModalData(r.data.data.data.filter(s => { const d = new Date(s.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })); }
      if (type === "debts") { const r = await api.get("/debts"); setModalData(r.data.data.data); }
      if (type === "clients") { const r = await api.get("/clients"); setModalData(r.data.data.data); }
      if (type === "recent") { const r = await api.get("/sales?limit=20"); setModalData(r.data.data.data); }
    } catch { toast.error("Ошибка"); }
    setModalLoading(false);
  };

  const formatNum = (n) => {
    const num = Number(n);
    if (num >= 1000000000) return (num/1000000000).toFixed(1) + " млрд";
    if (num >= 1000000) return (num/1000000).toFixed(1) + " млн";
    if (num >= 1000) return (num/1000).toFixed(0) + " тыс";
    return num.toLocaleString("ru-RU");
  };

  const avgCheck = (amt, cnt) => cnt > 0 ? formatNum(amt / cnt) : "0";
  const pct = (cur, prev) => prev > 0 ? ((cur - prev) / prev) * 100 : null;

  if (!data) return <DashboardSkeleton />;

  const hasChartData = chart.length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Панель</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{new Date().toLocaleDateString("ru-RU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* KPI — продажи и прибыль */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Продажи сегодня" value={formatNum(data.today.amount) + " сом"}
          sub={data.today.count + " чек · ср. " + avgCheck(data.today.amount, data.today.count)}
          trend={pct(data.today.amount, data.prev?.today)}
          bg="bg-indigo-50 dark:bg-indigo-500/10" color="text-indigo-600" delay="delay-100"
          onClick={isAdmin ? () => openModal("today") : undefined} />
        <StatCard icon={TrendingUp} label="Прибыль сегодня" value={formatNum(data.today.profit) + " сом"}
          bg="bg-emerald-50 dark:bg-emerald-500/10" color="text-emerald-600" delay="delay-100" show={isAdmin} />
        <StatCard icon={ShoppingCart} label="Продажи за месяц" value={formatNum(data.month.amount) + " сом"}
          sub={data.month.count + " чек"} trend={pct(data.month.amount, data.prev?.month)}
          bg="bg-blue-50 dark:bg-blue-500/10" color="text-blue-600" delay="delay-200"
          onClick={isAdmin ? () => openModal("month") : undefined} />
        <StatCard icon={TrendingUp} label="Прибыль за месяц" value={formatNum(data.month.profit) + " сом"}
          bg="bg-teal-50 dark:bg-teal-500/10" color="text-teal-600" delay="delay-200" show={isAdmin} />
      </div>

      {/* KPI — склад, долги, клиенты */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Boxes} label="Стоимость склада" value={formatNum(data.stockValue) + " сом"}
          bg="bg-amber-50 dark:bg-amber-500/10" color="text-amber-600" delay="delay-300" show={isAdmin} />
        <StatCard icon={CreditCard} label="Общий долг" value={formatNum(data.totalDebt) + " сом"}
          bg="bg-orange-50 dark:bg-orange-500/10" color="text-orange-500" delay="delay-300"
          onClick={isAdmin ? () => openModal("debts") : undefined} show={isAdmin} />
        <StatCard icon={Clock} label="Просрочка" value={formatNum(data.overdue?.amount || 0) + " сом"}
          sub={(data.overdue?.count || 0) + " долгов"}
          bg="bg-red-50 dark:bg-red-500/10" color="text-red-500" delay="delay-400"
          onClick={isAdmin ? () => openModal("debts") : undefined} show={isAdmin} />
        <StatCard icon={Users} label="Клиенты" value={data.totalClients}
          bg="bg-violet-50 dark:bg-violet-500/10" color="text-violet-600" delay="delay-400"
          onClick={isAdmin ? () => openModal("clients") : undefined} />
      </div>

      {/* Касса + способы оплаты */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up delay-400">
          <div onClick={() => navigate("/sessions")} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 flex items-center gap-4 cursor-pointer hover:shadow-md">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10"><Wallet size={22} className="text-emerald-600" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Касса</p>
              <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                {data.openSessions > 0
                  ? <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {data.openSessions} откр. смен</span>
                  : "Смены закрыты"}
              </p>
            </div>
            <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
          </div>
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Способы оплаты (месяц)</h2>
            {(() => {
              const pm = data.payments || {};
              const items = [
                { k: "CASH", label: "Наличные", color: "bg-emerald-500" },
                { k: "CARD", label: "Карта", color: "bg-blue-500" },
                { k: "DEBT", label: "Долг", color: "bg-red-500" },
                { k: "MIXED", label: "Смешанно", color: "bg-violet-500" },
              ];
              const sum = items.reduce((s, i) => s + (pm[i.k] || 0), 0) || 1;
              return (
                <div className="space-y-2">
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {items.map(i => (pm[i.k] || 0) > 0 && <div key={i.k} className={i.color} style={{ width: ((pm[i.k] || 0) / sum * 100) + "%" }} />)}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {items.map(i => (
                      <div key={i.k} className="flex items-center gap-1.5 text-xs">
                        <span className={"w-2.5 h-2.5 rounded-full flex-shrink-0 " + i.color} />
                        <span className="text-slate-500 dark:text-slate-400">{i.label}</span>
                        <span className="ml-auto font-semibold text-slate-700 dark:text-slate-300">{formatNum(pm[i.k] || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up delay-300">
        {hasChartData && (
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200 mb-4">Продажи за неделю</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chart} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000000 ? (v/1000000).toFixed(1) + "M" : v >= 1000 ? (v/1000).toFixed(0) + "K" : v} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #334155", backgroundColor: "#1E293B", color: "#F1F5F9", fontSize: "12px" }} cursor={{ stroke: "#4F46E5", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4F46E5", strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className={hasChartData ? "space-y-4" : "md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4"}>
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-500" />
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Мало на складе</h2>
                {data.lowStockCount > 0 && <span className="ml-auto bg-red-50 dark:bg-red-500/10 text-red-500 text-xs px-2 py-0.5 rounded-full font-medium">{data.lowStockCount} шт</span>}
              </div>
              {lowStock.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Всё в наличии</p>
              ) : (
                <div className="space-y-1">
                  {lowStock.slice(0, 8).map(p => (
                    <div key={p.id} onClick={() => navigate("/products")} className="flex items-center justify-between text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg px-2 py-1">
                      <span className="text-slate-700 dark:text-slate-300 truncate">{p.name}</span>
                      <span className={"font-medium flex-shrink-0 ml-2 " + (p.quantity <= 0 ? "text-red-600" : "text-red-500")}>{p.quantity}</span>
                    </div>
                  ))}
                  {lowStock.length > 8 && <p className="text-xs text-slate-400 text-center pt-1">и ещё {lowStock.length - 8}</p>}
                </div>
              )}
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-3 cursor-pointer" onClick={() => openModal("recent")}>
              <Package size={16} className="text-indigo-500" />
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Последние продажи</h2>
              <ExternalLink size={14} className="text-slate-400 ml-auto" />
            </div>
            {recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Продаж нет</p>
            ) : (
              <div className="space-y-1">
                {recentSales.map(s => (
                  <div key={s.id} onClick={() => navigate("/sales/" + s.id)} className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg px-2 py-1.5 cursor-pointer">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={"w-2 h-2 rounded-full flex-shrink-0 " + (s.status === "COMPLETED" ? "bg-emerald-500" : s.status === "PENDING" ? "bg-blue-500" : s.status === "CANCELLED" ? "bg-red-500" : "bg-yellow-500")} />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{s.client?.name || "—"}</span>
                    </div>
                    <span className="font-medium text-slate-800 dark:text-white ml-2 flex-shrink-0">{Number(s.totalAmount).toLocaleString("ru-RU")} сом</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <QuickModal open={modal === "today" || modal === "month" || modal === "recent"} onClose={() => setModal(null)} title={modal === "today" ? "Продажи сегодня" : modal === "month" ? "Продажи за месяц" : "Последние продажи"}>
        {modalLoading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : modalData.length === 0 ? <p className="text-center text-slate-400 py-8">Продаж нет</p> : (
          <div className="space-y-2">
            {modalData.map(s => (
              <div key={s.id} onClick={() => { setModal(null); navigate("/sales/" + s.id); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className={"w-2.5 h-2.5 rounded-full flex-shrink-0 " + (s.status === "COMPLETED" ? "bg-emerald-500" : s.status === "PENDING" ? "bg-blue-500" : s.status === "CANCELLED" ? "bg-red-500" : "bg-yellow-500")} />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">{s.client?.name || "—"}</p>
                    <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleString("ru-RU")} · {s.user?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white text-sm">{Number(s.totalAmount).toLocaleString("ru-RU")} сом</p>
                  <Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </QuickModal>

      <QuickModal open={modal === "debts"} onClose={() => setModal(null)} title="Долги">
        {modalLoading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : modalData.length === 0 ? <p className="text-center text-slate-400 py-8">Долгов нет</p> : (
          <div className="space-y-2">
            {modalData.map(d => (
              <div key={d.id} onClick={() => { setModal(null); navigate("/debts"); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{d.client?.name}</p>
                  <p className="text-xs text-slate-400">{d.client?.phone} · {new Date(d.dueDate).toLocaleDateString("ru-RU")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500 text-sm">{(Number(d.amount) - Number(d.paid)).toLocaleString("ru-RU")} сом</p>
                  <Badge variant={STATUS_DEBT[d.status]?.variant}>{STATUS_DEBT[d.status]?.label}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </QuickModal>

      <QuickModal open={modal === "clients"} onClose={() => setModal(null)} title="Клиенты">
        {modalLoading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : modalData.length === 0 ? <p className="text-center text-slate-400 py-8">Клиентов нет</p> : (
          <div className="space-y-2">
            {modalData.map(c => (
              <div key={c.id} onClick={() => { setModal(null); navigate("/clients/" + c.id); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-medium text-slate-800 dark:text-white text-sm">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </div>
                <Badge variant={c.isBlocked ? "red" : "green"}>{c.isBlocked ? "Заблокирован" : "Активен"}</Badge>
              </div>
            ))}
          </div>
        )}
      </QuickModal>
    </div>
  );
}
