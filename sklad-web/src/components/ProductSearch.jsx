import { useState, useEffect } from "react";
import { Search, X, Package } from "lucide-react";
import api from "../api/axios";

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };

export default function ProductSearch({ onSelect, onClose }) {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const timer = setTimeout(() => {
      api.get("/products?search=" + search).then(r => {
        setProducts(r.data.data.data.filter(p => p.quantity > 0));
        setLoading(false);
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск товара..." className="flex-1 bg-transparent text-sm text-slate-800 dark:text-white outline-none placeholder-slate-400" />
            {search && <button onClick={() => setSearch("")}><X size={14} className="text-slate-400" /></button>}
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">Товар не найден</div>
          ) : products.map(p => (
            <div key={p.id} onClick={() => { onSelect(p); onClose(); }} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-50 dark:border-slate-700/50">
              {p.imageUrl ? <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-slate-400" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white text-sm truncate">{p.name}</p>
                <p className="text-xs text-slate-400">{p.quantity} {UNITS[p.unit]} ост.</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{Number(p.sellPrice).toLocaleString("ru-RU")}</p>
                <p className="text-xs text-slate-400">сом</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
