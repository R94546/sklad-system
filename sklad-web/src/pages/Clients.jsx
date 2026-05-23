import { useEffect, useState } from "react";
import { Plus, Edit, Ban, X, ArrowRight, Phone, MapPin } from "lucide-react";
import EmptyState from "../components/EmptyState";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button, Input, Modal, Badge } from "../components/ui";

function ClientDetailModal({ client, onClose }) {
  const [sales, setSales] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    Promise.all([
      api.get("/sales?clientId=" + client.id + "&limit=20").then(r => setSales(r.data.data.data)),
      api.get("/debts?clientId=" + client.id).then(r => setDebts(r.data.data.data)),
    ]).finally(() => setLoading(false));
  }, [client]);

  if (!client) return null;

  const totalDebt = debts.reduce((s, d) => s + Number(d.amount) - Number(d.paid), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mijoz tafsiloti</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">{client.name[0]}</div>
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{client.name}</p>
              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm"><Phone size={12} />{client.phone}</div>
              {client.address && <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm"><MapPin size={12} />{client.address}</div>}
            </div>
            <Badge className="ml-auto" variant={client.isBlocked ? "red" : "green"}>{client.isBlocked ? "Bloklangan" : "Faol"}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Jami sotuvlar</p>
              <p className="text-xl font-bold text-slate-800 dark:text-white">{sales.length}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Umumiy qarz</p>
              <p className="text-xl font-bold text-red-500">{totalDebt.toLocaleString()} som</p>
            </div>
          </div>

          {loading ? <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : (
            <>
              {sales.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Oxirgi sotuvlar</p>
                  <div className="space-y-2">
                    {sales.slice(0, 5).map(s => (
                      <div key={s.id} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-slate-800 dark:text-white">{Number(s.totalAmount).toLocaleString()} som</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {debts.filter(d => d.status !== "PAID").length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Nasiyalar</p>
                  <div className="space-y-2">
                    {debts.filter(d => d.status !== "PAID").map(d => (
                      <div key={d.id} className="flex justify-between p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{new Date(d.dueDate).toLocaleDateString()}</span>
                        <span className="font-medium text-red-500">{(Number(d.amount)-Number(d.paid)).toLocaleString()} som</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", note: "" });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/clients?search=" + search); setClients(res.data.data.data); }
    catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const openCreate = () => { setEditing(null); setForm({ name: "", phone: "", address: "", note: "" }); setModal(true); };
  const openEdit = (e, c) => { e.stopPropagation(); setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address || "", note: c.note || "" }); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.put("/clients/" + editing.id, form); toast.success("Yangilandi"); }
      else { await api.post("/clients", form); toast.success("Yaratildi"); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Xatolik"); }
    setSaving(false);
  };

  const handleBlock = async (e, c) => {
    e.stopPropagation();
    try { await api.patch("/clients/" + c.id + "/block", { isBlocked: !c.isBlocked }); toast.success(c.isBlocked ? "Blokdan chiqarildi" : "Bloklandi"); load(); }
    catch { toast.error("Xatolik"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mijozlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <Input placeholder="Ism yoki telefon..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Ism","Telefon","Manzil","Holat","Amallar"].map((h,i) => (
                  <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (i >= 3 ? "text-center" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={99} className="py-2"><EmptyState type="clients" title="Mijozlar topilmadi" desc="Yangi mijoz qoshish uchun + tugmasini bosing" /></td></tr>
              ) : clients.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.phone}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{c.address || "-"}</td>
                  <td className="px-4 py-3 text-center"><Badge variant={c.isBlocked ? "red" : "green"}>{c.isBlocked ? "Bloklangan" : "Faol"}</Badge></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={e => openEdit(e, c)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"><Edit size={15} /></button>
                      <button onClick={e => handleBlock(e, c)} className={"p-1.5 rounded-lg " + (c.isBlocked ? "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10")}><Ban size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailModal client={selected} onClose={() => setSelected(null)} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Mijozni tahrirlash" : "Yangi mijoz"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Ism familiya" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+998901234567" required />
          <Input label="Manzil" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Izoh</label>
            <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} rows={3} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Bekor</Button>
            <Button type="submit" className="flex-1" loading={saving}>Saqlash</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
