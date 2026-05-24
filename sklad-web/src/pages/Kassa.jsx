import { useEffect, useState } from "react";
import { CheckCircle, X, RotateCcw, Package, Clock, ShoppingBag } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button, Select, Input, Badge } from "../components/ui";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Naqd" },
  { value: "CARD", label: "Karta" },
  { value: "DEBT", label: "Nasiya" },
  { value: "MIXED", label: "Aralash" },
];

const UNITS = { PIECE: "dona", KG: "kg", METER: "metr", LITER: "litr", BOX: "quti" };

function SaleConfirmModal({ sale, clients, onConfirm, onReturn, onClose }) {
  const [form, setForm] = useState({ paymentType: "CASH", clientId: sale.clientId || "", discount: 0, discountType: "AMOUNT", dueDate: "", debtAmount: "" });
  const [saving, setSaving] = useState(false);
  const clientOptions = clients.map(c => ({ value: c.id, label: c.name + " (" + c.phone + ")" }));
  const total = sale.items?.reduce((s, i) => s + Number(i.price) * i.quantity, 0) || 0;
  const discountAmount = form.discountType === "PERCENT" ? (total * Number(form.discount || 0) / 100) : Number(form.discount || 0);
  const finalTotal = total - discountAmount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Tolov qabul qilish</h2>
            <p className="text-xs text-slate-400">Sotuvchi: {sale.user?.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 space-y-2">
            {sale.items?.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.product?.imageUrl ? <img src={item.product.imageUrl} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-600 flex items-center justify-center"><Package size={12} className="text-slate-400" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{item.product?.name}</p>
                  <p className="text-xs text-slate-400">{item.quantity} {UNITS[item.product?.unit]} × {Number(item.price).toLocaleString()}</p>
                </div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{(item.quantity * Number(item.price)).toLocaleString()} som</p>
              </div>
            ))}
          </div>

          <Select label="Tolov turi" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
          <Select label="Mijoz" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} options={clientOptions} placeholder="Tanlang" />
          {(form.paymentType === "DEBT" || form.paymentType === "MIXED") && (
            <>
              <Input label="Nasiya muddati" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              {form.paymentType === "MIXED" && <Input label="Nasiya summasi" type="number" value={form.debtAmount} onChange={e => setForm({...form, debtAmount: e.target.value})} />}
            </>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Skidka</label>
            <div className="flex gap-2">
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="AMOUNT">Som</option>
                <option value="PERCENT">%</option>
              </select>
              <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" placeholder="0" />
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Jami:</span>
              <span className="text-slate-700 dark:text-slate-300">{total.toLocaleString()} som</span>
            </div>
            {Number(form.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Skidka:</span>
                <span className="text-red-500">-{discountAmount.toLocaleString()} som {form.discountType === "PERCENT" ? "(" + form.discount + "%)" : ""}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-1 border-t border-indigo-100 dark:border-indigo-500/20">
              <span className="text-slate-800 dark:text-white">Tolov:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString()} som</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => onReturn(sale.id)} >
              <RotateCcw size={15} /> Qaytarish
            </Button>
            <Button className="flex-1" loading={saving} onClick={async () => { setSaving(true); await onConfirm(sale.id, form); setSaving(false); }}>
              <CheckCircle size={15} /> Tasdiqlash
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Kassa() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [clients, setClients] = useState([]);

  const load = async () => {
    setLoading(true);
    try { const r = await api.get("/sales/kassa/queue"); setQueue(r.data.data); }
    catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get("/clients").then(r => setClients(r.data.data.data));
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirm = async (id, form) => {
    try {
      await api.post("/sales/kassa/" + id + "/confirm", form);
      toast.success("Sotuv tasdiqlandi!");
      setSelected(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Xatolik"); }
  };

  const handleReturn = async (id) => {
    if (!confirm("Qaytarilsinmi?")) return;
    try {
      await api.post("/sales/kassa/" + id + "/return");
      toast.success("Qaytarildi");
      setSelected(null);
      load();
    } catch { toast.error("Xatolik"); }
  };

  const totalInQueue = queue.reduce((s, sale) => s + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kassa</h1>
          <p className="text-sm text-slate-400 mt-0.5">Navbatda: {queue.length} ta sotuv</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-xl px-4 py-2 text-right">
          <p className="text-xs text-slate-400">Kutilayotgan summa</p>
          <p className="font-bold text-indigo-600 dark:text-indigo-400">{totalInQueue.toLocaleString()} som</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag size={40} className="text-slate-300 mb-4" />
            <p className="text-slate-400 font-medium">Navbat bosh</p>
            <p className="text-slate-300 text-sm mt-1">Sotuvchilar savatlarini yuborishi kutilmoqda</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {queue.map((sale, i) => (
              <div key={sale.id} onClick={() => setSelected(sale)} className="flex items-center gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm flex-shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-200">Sotuvchi: {sale.user?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock size={12} className="text-slate-400" />
                    <p className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleTimeString()} · {sale.items?.length} ta mahsulot</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800 dark:text-white">{Number(sale.totalAmount).toLocaleString()} som</p>
                  <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Navbatda</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <SaleConfirmModal sale={selected} clients={clients} onConfirm={handleConfirm} onReturn={handleReturn} onClose={() => setSelected(null)} />}
    </div>
  );
}
