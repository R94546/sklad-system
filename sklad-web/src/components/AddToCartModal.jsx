import { useState } from "react";
import { X, ShoppingCart, Package } from "lucide-react";
import { Button } from "./ui";

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };

export default function AddToCartModal({ product, onClose, onAdd }) {
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState(String(Number(product.sellPrice)));

  if (!product) return null;

  const qty = Math.max(0, parseFloat(quantity) || 0);
  const prc = parseFloat(price) || 0;
  const total = qty * prc;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm animate-fade-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-800 dark:text-white">Добавить в корзину</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
            {product.imageUrl
              ? <img src={product.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
              : <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center"><Package size={20} className="text-slate-400" /></div>
            }
            <div>
              <p className="font-semibold text-slate-800 dark:text-white text-sm">{product.name}</p>
              <p className="text-xs text-slate-400">{product.quantity} {UNITS[product.unit]} в наличии</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Кол-во</label>
              <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(String(Math.max(0, qty - 1)))} className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-lg font-bold">−</button>
                <input type="number" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} onBlur={() => setQuantity(String(Math.max(0, parseFloat(quantity) || 0)))} className="flex-1 text-center text-sm font-medium bg-transparent text-slate-800 dark:text-white outline-none py-2" min="0" max={product.quantity} />
                <button onClick={() => setQuantity(String(Math.min(Number(product.quantity), qty + 1)))} className="px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-lg font-bold">+</button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Цена (сом)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} onBlur={() => setPrice(String(parseFloat(price) || 0))} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-sm text-slate-500 dark:text-slate-400">Итого:</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{total.toLocaleString("ru-RU")} сом</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Отмена</Button>
            <Button className="flex-1" disabled={qty <= 0} onClick={() => { onAdd(product.id, qty, prc); onClose(); }}>
              <ShoppingCart size={15} /> Добавить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
