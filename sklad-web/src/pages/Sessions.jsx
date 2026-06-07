import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Badge } from "../components/ui";
import { X, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU");
const PAY = { CASH: "Наличные", CARD: "Карта", DEBT: "Долг", MIXED: "Смешанная" };

function Avatar({ name }) {
  const colors = ["bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-blue-500", "bg-green-500", "bg-orange-500"];
  const color = colors[name?.charCodeAt(0) % colors.length] || "bg-slate-500";
  return (
    <div className={"w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 " + color}>
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [detailId, setDetailId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/sessions" + (filter !== "ALL" ? "?status=" + filter : ""));
      setSessions(r.data.data || []);
    } catch { toast.error("Ошибка загрузки"); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Смены (кассы)</h1>
        <div className="flex gap-1.5">
          {[["ALL", "Все"], ["OPEN", "Открытые"], ["CLOSED", "Закрытые"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} className={"px-3 py-1.5 text-sm rounded-lg font-medium transition " + (filter === v ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700")}>{l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Смен не найдено</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Продавец</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Открыта</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Открытие</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Статус</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Подсчитано</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Разница</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {sessions.map((s) => (
                <tr key={s.id} onClick={() => setDetailId(s.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={s.seller?.name} />
                      <span className="font-medium text-slate-800 dark:text-white text-sm">{s.seller?.name || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">{new Date(s.openedAt).toLocaleString("ru-RU")}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-200 tabular-nums">{fmt(s.openingCash)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={s.status === "OPEN" ? "green" : "gray"}>{s.status === "OPEN" ? "Открыта" : "Закрыта"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700 dark:text-slate-200 tabular-nums">{s.closingCash != null ? fmt(s.closingCash) : "—"}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums">
                    {s.difference != null ? (
                      <span className={s.difference === 0 ? "text-emerald-500" : "text-rose-500 font-semibold"}>{s.difference > 0 ? "+" : ""}{fmt(s.difference)}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-indigo-500">Детали →</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailId && <SessionDetail id={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}

function SessionDetail({ id, onClose }) {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await api.get("/sessions/" + id); setS(r.data.data); }
      catch { toast.error("Ошибка"); }
      setLoading(false);
    })();
  }, [id]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">Смена{s ? " · " + (s.seller?.name || "") : ""}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {loading || !s ? (
          <div className="p-10 flex justify-center"><div className="animate-spin h-7 w-7 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Открытие" value={fmt(s.openingCash) + " сом"} />
              <Stat label="Продажи" value={fmt(s.salesTotal) + " сом"} />
              <Stat label="Ожидаемая наличность" value={fmt(s.expectedCash) + " сом"} />
              <Stat label="Подсчитано" value={s.closingCash != null ? fmt(s.closingCash) + " сом" : "—"} />
            </div>
            {s.difference != null && (
              <div className={"flex justify-between items-baseline px-3 py-2 rounded-lg " + (s.difference === 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10")}>
                <span className="font-medium text-slate-600 dark:text-slate-300">Разница</span>
                <span className={"text-xl font-extrabold tabular-nums " + (s.difference === 0 ? "text-emerald-500" : "text-rose-500")}>{s.difference > 0 ? "+" : ""}{fmt(s.difference)} сом</span>
              </div>
            )}
            <div className="text-xs text-slate-400">
              Открыта: {new Date(s.openedAt).toLocaleString("ru-RU")}{s.closedAt ? " · Закрыта: " + new Date(s.closedAt).toLocaleString("ru-RU") : ""}
            </div>
            {s.openingNote && <p className="text-sm text-slate-500">Заметка (открытие): {s.openingNote}</p>}
            {s.closingNote && <p className="text-sm text-slate-500">Заметка (закрытие): {s.closingNote}</p>}

            {s.movements?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Приход / расход</p>
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  {s.movements.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0 text-sm">
                      {m.type === "IN" ? <ArrowDownCircle size={16} className="text-emerald-500" /> : <ArrowUpCircle size={16} className="text-rose-500" />}
                      <span className="text-slate-600 dark:text-slate-300">{m.reason || (m.type === "IN" ? "Приход" : "Расход")}</span>
                      <span className={"ml-auto font-semibold tabular-nums " + (m.type === "IN" ? "text-emerald-500" : "text-rose-500")}>{m.type === "IN" ? "+" : "−"}{fmt(m.amount)} сом</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Продажи смены ({s.sales?.length || 0})</p>
              {s.sales?.length ? (
                <div className="border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  {s.sales.map((sale) => (
                    <div key={sale.id} className="flex items-center gap-2 px-3 py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-0 text-sm">
                      <span className="text-slate-400">{new Date(sale.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-slate-500">{PAY[sale.paymentType] || sale.paymentType}</span>
                      <span className="ml-auto font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(sale.totalAmount)} сом</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">Продаж нет</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-700/40 rounded-lg px-3 py-2">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="font-bold text-slate-800 dark:text-white tabular-nums">{value}</p>
    </div>
  );
}
