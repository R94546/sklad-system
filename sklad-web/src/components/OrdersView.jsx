import { useEffect, useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Info, X, Package, ShoppingCart, ChevronDown } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU");
const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };
const PAY = { CASH: "Наличные", CARD: "Карта", DEBT: "Долг", MIXED: "Смешанная" };
const STATUS = {
  COMPLETED: { label: "Оплачено", cls: "bg-emerald-500/15 text-emerald-400" },
  PENDING: { label: "Корзина", cls: "bg-sky-500/15 text-sky-400" },
  SENT_TO_KASSA: { label: "На кассе", cls: "bg-amber-500/15 text-amber-400" },
  CANCELLED: { label: "Отменён", cls: "bg-rose-500/15 text-rose-400" },
  RETURNED: { label: "Возврат", cls: "bg-purple-500/15 text-purple-400" },
};
const FILTERS = [
  { value: "ALL", label: "Все" },
  { value: "COMPLETED", label: "Оплачено" },
  { value: "PENDING", label: "Корзина" },
  { value: "SENT_TO_KASSA", label: "На кассе" },
  { value: "CANCELLED", label: "Отменён" },
  { value: "RETURNED", label: "Возврат" },
];
const PER_PAGE = 12;

export default function OrdersView({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get("/sales?limit=200");
        let list = r.data.data.data || [];
        if (!isAdmin) list = list.filter((s) => s.user?.name === user?.name);
        setOrders(list);
      } catch { toast.error("Ошибка загрузки заказов"); }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = orders;
    if (status !== "ALL") list = list.filter((s) => s.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((o) =>
        (o.client?.name || "").toLowerCase().includes(s) ||
        (o.user?.name || "").toLowerCase().includes(s) ||
        o.id.toLowerCase().includes(s) ||
        String(Math.round(Number(o.totalAmount))).includes(s)
      );
    }
    return list;
  }, [orders, status, q]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, pages);
  const pageItems = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const dt = (iso) => {
    const d = new Date(iso);
    return { date: d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }), time: d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) };
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#141b27] text-slate-200">
      {/* Панель: поиск + фильтр + пагинация */}
      <div className="flex flex-wrap items-center gap-3 p-3 border-b border-black/30 shrink-0">
        <div className="relative flex-1 min-w-[200px] max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Поиск заказов..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm bg-[#1b2330] border border-white/10 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div className="relative">
          <button onClick={() => setFilterOpen((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1b2330] border border-white/10 hover:bg-[#222c3c] transition">
            {FILTERS.find((f) => f.value === status)?.label} <ChevronDown size={15} />
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 mt-2 w-44 bg-[#222c3c] rounded-lg shadow-2xl border border-white/10 py-1.5 z-50">
                {FILTERS.map((f) => (
                  <button key={f.value} onClick={() => { setStatus(f.value); setPage(1); setFilterOpen(false); }} className={"w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition " + (status === f.value ? "text-teal-400 font-semibold" : "text-slate-200")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="tabular-nums">{filtered.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1}-{Math.min(safePage * PER_PAGE, filtered.length)} / {filtered.length}</span>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1b2330] border border-white/10 disabled:opacity-30 hover:bg-[#222c3c] transition"><ChevronLeft size={16} /></button>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={safePage >= pages} className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1b2330] border border-white/10 disabled:opacity-30 hover:bg-[#222c3c] transition"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Список заказов */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="animate-spin h-7 w-7 border-4 border-teal-500 border-t-transparent rounded-full" /></div>
        ) : pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
            <ShoppingCart size={44} className="mb-3" />
            <p>Заказы не найдены</p>
          </div>
        ) : (
          pageItems.map((o) => {
            const { date, time } = dt(o.createdAt);
            const st = STATUS[o.status] || { label: o.status, cls: "bg-slate-500/15 text-slate-400" };
            return (
              <div key={o.id} onClick={() => setDetailId(o.id)} className="flex items-center gap-4 px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition">
                <div className="w-16 shrink-0">
                  <p className="font-semibold text-white leading-tight">{date}</p>
                  <p className="text-xs text-slate-400">{time}</p>
                </div>
                <div className="w-24 shrink-0">
                  <p className="font-bold text-white tabular-nums">#{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-500">{o.items?.length || 0} тов.</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-slate-200">{o.client?.name || "—"}</p>
                  <p className="text-xs text-slate-500 truncate">{o.user?.name}</p>
                </div>
                <p className="font-bold text-white whitespace-nowrap tabular-nums">{fmt(o.totalAmount)} сом</p>
                <span className={"text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap " + st.cls}>{st.label}</span>
                <button onClick={(e) => { e.stopPropagation(); setDetailId(o.id); }} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition shrink-0"><Info size={18} /></button>
              </div>
            );
          })
        )}
      </div>

      {detailId && <OrderDetailModal id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

/* ===== Модал деталей заказа ===== */
function OrderDetailModal({ id, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await api.get("/sales/" + id);
        setOrder(r.data.data);
      } catch { toast.error("Ошибка загрузки"); }
      setLoading(false);
    })();
  }, [id]);

  const st = order ? (STATUS[order.status] || { label: order.status, cls: "bg-slate-500/15 text-slate-400" }) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">
            Заказ {order ? "#" + order.id.slice(-6).toUpperCase() : ""}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading || !order ? (
          <div className="p-10 flex justify-center"><div className="animate-spin h-7 w-7 border-4 border-teal-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Продавец" value={order.user?.name || "—"} />
              <Field label="Клиент" value={order.client?.name || "—"} />
              <Field label="Дата" value={new Date(order.createdAt).toLocaleString("ru-RU")} />
              <Field label="Оплата" value={PAY[order.paymentType] || order.paymentType} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">Статус:</span>
              <span className={"text-xs px-2.5 py-1 rounded-full font-medium " + st.cls}>{st.label}</span>
            </div>

            <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
              {(order.items || []).map((it) => (
                <div key={it.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                  {it.product?.imageUrl ? <img src={it.product.imageUrl} className="w-9 h-9 rounded-lg object-cover" /> : <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Package size={15} className="text-slate-400" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{it.product?.name}</p>
                    <p className="text-xs text-slate-400">{it.quantity} {UNITS[it.product?.unit] || "шт"} × {fmt(it.price)} сом</p>
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">{fmt(it.quantity * it.price)} сом</p>
                </div>
              ))}
            </div>

            <div className="space-y-1 pt-1">
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-sm text-rose-500"><span>Скидка</span><span className="tabular-nums">−{fmt(order.discount)} сом</span></div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-slate-800 dark:text-white">Итого</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{fmt(order.totalAmount)} сом</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-slate-800 dark:text-white font-medium truncate">{value}</p>
    </div>
  );
}
