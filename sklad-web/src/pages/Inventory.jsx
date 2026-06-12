import { useEffect, useState } from "react";
import { ClipboardCheck, Search } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button } from "../components/ui";
import ViewToggle from "../components/ViewToggle";
import { getSavedView, saveView } from "../utils/viewPref";
import useBarcodeScanner from "../hooks/useBarcodeScanner";

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [counts, setCounts] = useState({}); // productId -> строка факт. остатка
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState(() => getSavedView("inventory", "list"));

  const changeView = (v) => { setView(v); saveView("inventory", v); };

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/products?limit=1000");
      const list = r.data.data.data || [];
      setProducts(list);
      setCounts(Object.fromEntries(list.map((p) => [p.id, String(p.quantity)])));
    } catch { toast.error("Ошибка"); }
    setLoading(false);
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search.trim()));

  // Сканер-пистолет: подставляет штрихкод в поиск — остаётся только ввести факт
  useBarcodeScanner((code) => {
    const found = products.find((p) => p.barcode === code);
    setSearch(code);
    if (found) toast.success(found.name);
    else toast.error("Товар не найден: " + code);
  });

  const diffOf = (p) => {
    const actual = parseFloat(String(counts[p.id] ?? "").replace(",", "."));
    if (!isFinite(actual)) return null;
    return actual - Number(p.quantity);
  };

  const changedCount = products.filter((p) => { const d = diffOf(p); return d !== null && d !== 0; }).length;

  const apply = async () => {
    const items = products
      .map((p) => ({ productId: p.id, actualQty: parseFloat(String(counts[p.id] ?? "").replace(",", ".")) }))
      .filter((it) => isFinite(it.actualQty));
    setSaving(true);
    try {
      const r = await api.post("/products/inventory", { items });
      const n = r.data.data?.length || 0;
      toast.success(n > 0 ? "Скорректировано позиций: " + n : "Расхождений нет");
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Ошибка"); }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Инвентаризация</h1>
          <p className="text-sm text-slate-400 mt-1">Сверка фактического остатка с учётным</p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={changeView} />
          <Button onClick={apply} loading={saving} disabled={changedCount === 0}>
            <ClipboardCheck size={16} /> Применить{changedCount > 0 ? " (" + changedCount + ")" : ""}
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск товара..." className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      {view === "grid" && (
        loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-slate-400 py-12">Товары не найдены</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => {
              const d = diffOf(p);
              return (
                <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-xs text-slate-400">Учётный: <span className="font-medium tabular-nums">{p.quantity} {UNITS[p.unit]}</span></p>
                  <input type="number" step="any" value={counts[p.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [p.id]: e.target.value }))}
                    className="w-full text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums" />
                  <p className={"text-sm text-center font-semibold tabular-nums " + (d === null ? "text-slate-300" : d === 0 ? "text-slate-400" : d > 0 ? "text-emerald-500" : "text-red-500")}>
                    {d === null ? "—" : (d > 0 ? "+" : "") + d}
                  </p>
                </div>
              );
            })}
          </div>
        )
      )}

      {view === "list" && (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Товар</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Учётный</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Факт</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Разница</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Товары не найдены</td></tr>
              ) : filtered.map((p) => {
                const d = diffOf(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{p.name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400 tabular-nums">{p.quantity} {UNITS[p.unit]}</td>
                    <td className="px-4 py-2.5">
                      <input type="number" step="any" value={counts[p.id] ?? ""} onChange={(e) => setCounts((c) => ({ ...c, [p.id]: e.target.value }))}
                        className="w-24 mx-auto block text-center rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums" />
                    </td>
                    <td className={"px-4 py-2.5 text-right font-semibold tabular-nums " + (d === null ? "text-slate-300" : d === 0 ? "text-slate-400" : d > 0 ? "text-emerald-500" : "text-red-500")}>
                      {d === null ? "—" : (d > 0 ? "+" : "") + d}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
