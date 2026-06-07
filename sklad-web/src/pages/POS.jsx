import { useEffect, useState, useMemo } from "react";
import { Search, Trash2, Package, X, ScanLine, UserPlus, Minus, Plus } from "lucide-react";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import toast from "react-hot-toast";

const UNITS = { PIECE: "dona", KG: "kg", METER: "m", LITER: "l", BOX: "quti" };
const CAT_COLORS = ["#1D9E75","#D4537E","#378ADD","#BA7517","#7F77DD","#D85A30","#639922","#0F6E56"];
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU");

export default function POS() {
  const { cart, fetchCart, addToCart, removeItem, updateItem, confirmCart } = useCartStore();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pay, setPay] = useState({ paymentType: "CASH", clientId: "", discount: 0, discountType: "AMOUNT", dueDate: "", debtAmount: "" });
  const [clients, setClients] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, c, cl] = await Promise.all([
          api.get("/products?limit=500"),
          api.get("/categories"),
          api.get("/clients"),
        ]);
        setProducts(p.data.data.data || []);
        setCategories(c.data.data.data || c.data.data || []);
        setClients(cl.data.data.data || []);
      } catch { toast.error("Yuklashda xatolik"); }
      setLoading(false);
      fetchCart();
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat) list = list.filter((p) => p.categoryId === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode || "").includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  const catColor = (id) => {
    const i = categories.findIndex((c) => c.id === id);
    return CAT_COLORS[i % CAT_COLORS.length];
  };
  const qtyInCart = (pid) => cart?.items?.find((i) => i.productId === pid)?.quantity || 0;

  const handleAdd = async (p) => {
    if (p.quantity <= 0) return toast.error(p.name + " qoldiqda yoq");
    const ok = await addToCart(p.id, 1, p.sellPrice);
    if (!ok) toast.error("Xatolik");
  };

  const handleSearchEnter = async (e) => {
    if (e.key !== "Enter") return;
    const exact = products.find((p) => p.barcode === search.trim());
    if (exact) { await handleAdd(exact); setSearch(""); }
    else if (filtered.length === 1) { await handleAdd(filtered[0]); setSearch(""); }
  };

  const items = cart?.items || [];
  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const discAmt = pay.discountType === "PERCENT" ? (total * Number(pay.discount || 0) / 100) : Number(pay.discount || 0);
  const finalTotal = total - discAmt;

  const handleConfirm = async () => {
    if (!items.length) return toast.error("Savat bosh");
    if ((pay.paymentType === "DEBT" || pay.paymentType === "MIXED") && !pay.clientId) return toast.error("Mijoz tanlang");
    setSaving(true);
    const ok = await confirmCart(pay);
    setSaving(false);
    if (ok) {
      toast.success("Sotuv amalga oshirildi");
      setPay({ paymentType: "CASH", clientId: "", discount: 0, discountType: "AMOUNT", dueDate: "", debtAmount: "" });
      const r = await api.get("/products?limit=500");
      setProducts(r.data.data.data || []);
    } else toast.error("Xatolik");
  };

  return (
    <div className="flex h-[calc(100vh-1px)] -m-4 md:-m-6 bg-slate-100 dark:bg-slate-900">
      <div className="w-[38%] min-w-[340px] flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-white">Savat ({items.length})</h2>
          {items.length > 0 && (
            <button onClick={async () => { for (const it of items) { await removeItem(it.id); } }} className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1 rounded flex items-center gap-1"><Trash2 size={13} /> Tozalash</button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600">
              <Package size={40} className="mb-2" /><p className="text-sm">Mahsulot tanlang</p>
            </div>
          ) : items.map((i) => (
            <div key={i.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/40 rounded-lg p-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{i.product?.name}</p>
                <p className="text-xs text-slate-400">{fmt(i.price)} som / {UNITS[i.product?.unit] || ""}</p>
              </div>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                <button onClick={() => updateItem(i.id, i.quantity - 1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Minus size={14} /></button>
                <span className="w-7 text-center text-sm font-semibold text-slate-800 dark:text-white">{i.quantity}</span>
                <button onClick={() => updateItem(i.id, i.quantity + 1)} className="p-1.5 text-slate-500 hover:text-indigo-600"><Plus size={14} /></button>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap w-20 text-right">{fmt(i.quantity * i.price)}</p>
              <button onClick={() => removeItem(i.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-3">
          <div className="flex gap-2">
            <select value={pay.paymentType} onChange={(e) => setPay({ ...pay, paymentType: e.target.value })} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="CASH">Naqd</option><option value="CARD">Karta</option><option value="DEBT">Nasiya</option><option value="MIXED">Aralash</option>
            </select>
            <select value={pay.discountType} onChange={(e) => setPay({ ...pay, discountType: e.target.value })} className="w-20 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              <option value="AMOUNT">som</option><option value="PERCENT">%</option>
            </select>
            <input type="number" value={pay.discount} onChange={(e) => setPay({ ...pay, discount: e.target.value })} placeholder="0" className="w-20 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          {(pay.paymentType === "DEBT" || pay.paymentType === "MIXED") && (
            <div className="flex gap-2">
              <select value={pay.clientId} onChange={(e) => setPay({ ...pay, clientId: e.target.value })} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="">Mijoz tanlang</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
              <input type="date" value={pay.dueDate} onChange={(e) => setPay({ ...pay, dueDate: e.target.value })} className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>
          )}
          {discAmt > 0 && <div className="flex justify-between text-sm text-red-500"><span>Skidka</span><span>-{fmt(discAmt)} som</span></div>}
          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-slate-400">Jami</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(finalTotal)} som</span>
          </div>
          <button onClick={handleConfirm} disabled={saving || !items.length} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl transition">
            {saving ? "..." : "TOLOV"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 flex gap-2 items-center bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearchEnter} placeholder="Mahsulot yoki shtrixkod..." className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="px-3 py-2 flex gap-2 overflow-x-auto bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <button onClick={() => setActiveCat(null)} className={"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap " + (!activeCat ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300")}>Hammasi</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={activeCat === c.id ? { backgroundColor: catColor(c.id), color: "#fff" } : { color: catColor(c.id) }} className={"px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap " + (activeCat === c.id ? "" : "bg-slate-100 dark:bg-slate-700")}>{c.name}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">{Array.from({ length: 14 }).map((_, i) => <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600"><Package size={40} className="mb-2" /><p>Mahsulot topilmadi</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {filtered.map((p) => {
                const inCart = qtyInCart(p.id);
                const low = p.quantity <= 0;
                return (
                  <button key={p.id} onClick={() => handleAdd(p)} disabled={low} className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden text-left hover:ring-2 hover:ring-indigo-400 transition disabled:opacity-40 group">
                    {inCart > 0 && <span className="absolute top-1.5 right-1.5 z-10 min-w-5 h-5 px-1 bg-slate-900 text-white text-xs rounded-full flex items-center justify-center font-bold">{inCart}</span>}
                    <div className="aspect-square bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package size={28} className="text-slate-300" />}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-slate-800 dark:text-white leading-tight line-clamp-2 h-8">{p.name}</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">{fmt(p.sellPrice)}</p>
                      <p className={"text-[10px] " + (low ? "text-red-500" : "text-slate-400")}>{low ? "Qoldiq yoq" : "Qoldiq: " + p.quantity}</p>
                    </div>
                    <div className="h-1" style={{ backgroundColor: catColor(p.categoryId) }} />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



