import { useEffect, useState } from "react";
import { Plus, X, ArrowRight, Trash2, Edit, RotateCcw } from "lucide-react";
import EmptyState from "../components/EmptyState";
import useAuthStore from "../store/authStore";
import ProductSearch from "../components/ProductSearch";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button, Input, Select, Modal, Badge } from "../components/ui";
import { exportToExcel } from "../utils/export";
import { Download } from "lucide-react";

const PAYMENT_LABELS = { CASH: "Naqd", CARD: "Karta", DEBT: "Nasiya", MIXED: "Aralash" };
const PAYMENT_OPTIONS = Object.entries(PAYMENT_LABELS).map(([value, label]) => ({ value, label }));
const STATUS = { COMPLETED: { label: "Bajarildi", variant: "green" }, CANCELLED: { label: "Bekor", variant: "red" }, RETURNED: { label: "Qaytarildi", variant: "yellow" } };

function SaleDetailModal({ sale, onClose, onDelete, onEdit, onReturn, isAdmin }) {
  if (!sale) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Sotuv tafsiloti</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {isAdmin && (
            <div className="flex gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
              <button onClick={() => onDelete(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg font-medium"><Trash2 size={14} /> Ochirish</button>
              <button onClick={() => onEdit(sale)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg font-medium"><Edit size={14} /> Tahrirlash</button>
              {sale.status === "COMPLETED" && <button onClick={() => onReturn(sale.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg font-medium"><RotateCcw size={14} /> Qaytarish</button>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Mijoz</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">{sale.client?.name || "Noaniq"}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Sotuvchi</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">{sale.user?.name}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Tolov</p>
              <Badge variant="blue">{PAYMENT_LABELS[sale.paymentType]}</Badge>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Holat</p>
              <Badge variant={STATUS[sale.status]?.variant}>{STATUS[sale.status]?.label}</Badge>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Sana</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">{new Date(sale.createdAt).toLocaleString()}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Jami summa</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{Number(sale.totalAmount).toLocaleString()} som</p>
            </div>
          </div>
          {sale.items && sale.items.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Mahsulotlar</p>
              <div className="space-y-2">
                {sale.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">{item.product?.name}</p>
                      <p className="text-xs text-slate-400">{item.quantity} x {Number(item.price).toLocaleString()} som</p>
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white">{(item.quantity * Number(item.price)).toLocaleString()} som</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Number(sale.discount) > 0 && (
            <div className="flex justify-between text-sm px-1">
              <span className="text-slate-500">Skidka:</span>
              <span className="text-red-500 font-medium">-{Number(sale.discount).toLocaleString()} som</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState(false);
  const [searchIndex, setSearchIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [editForm, setEditForm] = useState({ paymentType: "CASH", status: "COMPLETED", discount: 0 });
  const [editSaving, setEditSaving] = useState(false);
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === "ADMIN";
  const [form, setForm] = useState({ paymentType: "CASH", clientId: "", dueDate: "", debtAmount: "", discount: 0, items: [] });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/sales"); setSales(res.data.data.data); }
    catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get("/products").then(r => setProducts(r.data.data.data));
    api.get("/clients").then(r => setClients(r.data.data.data));
  }, []);

  const openDetail = async (sale) => {
    setDetailLoading(true);
    setSelectedSale(sale);
    try {
      const r = await api.get("/sales/" + sale.id);
      setSelectedSale(r.data.data);
    } catch {}
    setDetailLoading(false);
  };

  const clientOptions = clients.map(c => ({ value: c.id, label: c.name + " (" + c.phone + ")" }));
  const addItem = () => setForm({ ...form, items: [...form.items, { productId: "", quantity: 1, price: "" }] });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    if (field === "productId") { const p = products.find(p => p.id === value); if (p) items[i].price = p.sellPrice; }
    setForm({ ...form, items });
  };
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const total = form.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity || 0)), 0);
  const finalTotal = total - Number(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.items.length === 0) return toast.error("Mahsulot qoshing");
    setSaving(true);
    try {
      await api.post("/sales", { ...form, discount: Number(form.discount || 0) });
      toast.success("Sotuv amalga oshirildi");
      setModal(false);
      setForm({ paymentType: "CASH", clientId: "", dueDate: "", debtAmount: "", discount: 0, items: [] });
      load();
    } catch (err) { toast.error(err.response?.data?.message || "Xatolik"); }
    setSaving(false);
  };

  const filtered = sales.filter(s =>
    s.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sotuvlar</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(filtered, [
            { title: "Sana", key: "createdAt", getValue: r => new Date(r.createdAt).toLocaleDateString() },
            { title: "Mijoz", key: "client", getValue: r => r.client?.name || "-" },
            { title: "Sotuvchi", key: "user", getValue: r => r.user?.name },
            { title: "Summa", key: "totalAmount", getValue: r => Number(r.totalAmount) },
            { title: "Tolov", key: "paymentType", getValue: r => PAYMENT_LABELS[r.paymentType] },
          ], "sotuvlar")}><Download size={16} /> Excel</Button>
          <Button onClick={() => setModal(true)}><Plus size={16} /> Yangi sotuv</Button>
        </div>
      </div>

      <Input placeholder="Mijoz yoki sotuvchi..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Mijoz","Summa","Tolov","Holat"].map((h,i) => (
                  <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (i >= 3 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={99} className="py-2"><EmptyState type="sales" title="Sotuvlar topilmadi" desc="Yangi sotuv qoshish uchun tugmani bosing" /></td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} onClick={() => openDetail(s)} className={"cursor-pointer transition-none " + (s.status === "RETURNED" ? "bg-red-50/50 dark:bg-red-500/5 opacity-60" : "hover:bg-slate-50 dark:hover:bg-slate-700/30")}>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{s.client?.name || "-"}</td>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-white text-right">{Number(s.totalAmount).toLocaleString()} som</td>
                  <td className="px-4 py-3 text-right"><Badge variant="blue">{PAYMENT_LABELS[s.paymentType]}</Badge></td>
                  <td className="px-4 py-3 text-right"><Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge></td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {productSearch && <ProductSearch onClose={() => setProductSearch(false)} onSelect={(p) => { updateItem(searchIndex, "productId", p.id); }} />}
      <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} isAdmin={isAdmin} onReturn={async (id) => { if (!confirm("Sotuvni qaytarasizmi? Mahsulotlar ombarga qaytadi.")) return; try { await api.post("/sales/kassa/" + id + "/return", { reason: "Admin qaytardi" }); toast.success("Qaytarildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} onEdit={(s) => { setEditSale(s); setEditForm({ paymentType: s.paymentType, status: s.status, discount: s.discount || 0 }); setSelectedSale(null); setEditModal(true); }} onDelete={async (id) => { if (!confirm("Ochirmoqchimisiz?")) return; try { await api.delete("/sales/" + id); toast.success("Ochirildi"); setSelectedSale(null); load(); } catch { toast.error("Xatolik"); } }} />

      <Modal open={editModal} onClose={() => setEditModal(false)} title="Sotuvni tahrirlash" size="sm">
        <div className="space-y-4">
          <Select label="Tolov turi" value={editForm.paymentType} onChange={e => setEditForm({...editForm, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
          <Select label="Holat" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} options={[{value:"COMPLETED",label:"Bajarildi"},{value:"CANCELLED",label:"Bekor"},{value:"RETURNED",label:"Qaytarildi"}]} />
          <Input label="Skidka (som)" type="number" value={editForm.discount} onChange={e => setEditForm({...editForm, discount: e.target.value})} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setEditModal(false)}>Bekor</Button>
            <Button className="flex-1" loading={editSaving} onClick={async () => { setEditSaving(true); try { await api.put("/sales/" + editSale.id, editForm); toast.success("Yangilandi"); setEditModal(false); load(); } catch { toast.error("Xatolik"); } setEditSaving(false); }}>Saqlash</Button>
          </div>
        </div>
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)} title="Yangi sotuv" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tolov turi" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
            <Select label="Mijoz" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} options={clientOptions} placeholder="Tanlang" />
          </div>
          {(form.paymentType === "DEBT" || form.paymentType === "MIXED") && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Nasiya muddati" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required />
              {form.paymentType === "MIXED" && <Input label="Nasiya summasi" type="number" value={form.debtAmount} onChange={e => setForm({...form, debtAmount: e.target.value})} placeholder="Nasiya qismi" required />}
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mahsulotlar</label>
              <button type="button" onClick={addItem} className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline font-medium">+ Qoshish</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <button type="button" onClick={() => { setSearchIndex(i); setProductSearch(true); }} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-left bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    {item.productId ? (products.find(p => p.id === item.productId)?.name || "Tanlangan") : <span className="text-slate-400">Mahsulot tanlang</span>}
                  </button>
                  <input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", e.target.value)} min="1" required className="w-20 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="Miqdor" />
                  <input type="number" value={item.price} readOnly className="w-28 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed" placeholder="Narx" />
                  <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"><X size={16} /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <Input label="Skidka (som)" type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg px-4 py-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Jami</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString()} som</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Sotish</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}




