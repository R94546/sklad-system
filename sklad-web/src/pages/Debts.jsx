import { useEffect, useState } from "react";
import { DollarSign, X, ArrowRight } from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button, Input, Modal, Badge } from "../components/ui";
import { exportToExcel } from "../utils/export";
import { Download } from "lucide-react";

const STATUS = { PENDING: { label: "Kutilmoqda", variant: "yellow" }, PAID: { label: "Tolangan", variant: "green" }, OVERDUE: { label: "Muddati otgan", variant: "red" } };

function DebtDetailModal({ debt, onClose, onPay }) {
  if (!debt) return null;
  const remaining = Number(debt.amount) - Number(debt.paid);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Nasiya tafsiloti</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">{debt.client?.name?.[0]}</div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white">{debt.client?.name}</p>
              <p className="text-sm text-slate-400">{debt.client?.phone}</p>
            </div>
            <Badge className="ml-auto" variant={STATUS[debt.status]?.variant}>{STATUS[debt.status]?.label}</Badge>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Umumiy</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">{Number(debt.amount).toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Tolangan</p>
              <p className="font-bold text-emerald-600 text-sm">{Number(debt.paid).toLocaleString()}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Qoldiq</p>
              <p className="font-bold text-red-500 text-sm">{remaining.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex justify-between px-1 text-sm">
            <span className="text-slate-500 dark:text-slate-400">Muddat:</span>
            <span className="font-medium text-slate-800 dark:text-white">{new Date(debt.dueDate).toLocaleDateString()}</span>
          </div>

          {debt.status !== "PAID" && (
            <Button className="w-full" onClick={() => onPay(debt)}>
              <DollarSign size={16} /> Tolov qabul qilish
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/debts"); setDebts(res.data.data.data); }
    catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openPay = (d) => { setSelected(d); setAmount(""); setDetailModal(null); setPayModal(true); };

  const handlePay = async (e) => {
    e.preventDefault();
    setPaying(true);
    try {
      await api.patch("/debts/" + selected.id + "/pay", { amount: Number(amount) });
      toast.success("Tolov qabul qilindi");
      setPayModal(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Xatolik"); }
    setPaying(false);
  };

  const filtered = debts.filter(d =>
    d.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.client?.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nasiyalar</h1>
        <Button variant="outline" onClick={() => exportToExcel(filtered, [
          { title: "Mijoz", getValue: r => r.client?.name },
          { title: "Telefon", getValue: r => r.client?.phone },
          { title: "Summa", getValue: r => Number(r.amount) },
          { title: "Tolangan", getValue: r => Number(r.paid) },
          { title: "Qoldiq", getValue: r => Number(r.amount) - Number(r.paid) },
          { title: "Muddat", getValue: r => new Date(r.dueDate).toLocaleDateString() },
          { title: "Holat", getValue: r => r.status },
        ], "nasiyalar")}><Download size={16} /> Excel</Button>
      </div>

      <Input placeholder="Mijoz ismi yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Mijoz","Qoldiq","Holat"].map((h,i) => (
                  <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (i >= 2 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={99} className="py-2"><EmptyState type="debts" title="Nasiyalar topilmadi" desc="Hozircha nasiyalar yoq" /></td></tr>
              ) : filtered.map(d => (
                <tr key={d.id} onClick={() => setDetailModal(d)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{d.client?.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">{d.client?.phone}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white hidden md:table-cell">{Number(d.amount).toLocaleString()} som</td>
                  <td className="px-4 py-3 text-right text-emerald-600 hidden md:table-cell">{Number(d.paid).toLocaleString()} som</td>
                  <td className="px-4 py-3 text-right text-red-500 font-medium">{(Number(d.amount)-Number(d.paid)).toLocaleString()} som</td>
                  <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{new Date(d.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right"><Badge variant={STATUS[d.status]?.variant}>{STATUS[d.status]?.label}</Badge></td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DebtDetailModal debt={detailModal} onClose={() => setDetailModal(null)} onPay={openPay} />

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Tolov qabul qilish" size="sm">
        {selected && (
          <>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
              <p className="font-medium text-slate-800 dark:text-white">{selected.client?.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{selected.client?.phone}</p>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-slate-500">Qoldiq:</span>
                <span className="font-bold text-red-500">{(Number(selected.amount)-Number(selected.paid)).toLocaleString()} som</span>
              </div>
            </div>
            <form onSubmit={handlePay} className="space-y-4">
              <Input label="Tolov summasi" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Summani kiriting" required />
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setPayModal(false)}>Bekor</Button>
                <Button type="submit" className="flex-1" loading={paying}>Tasdiqlash</Button>
              </div>
            </form>
          </>
        )}
      </Modal>
    </div>
  );
}


