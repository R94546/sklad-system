import { useEffect, useState } from "react";
import { Plus, Edit, Power, X, LogOut } from "lucide-react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Button, Input, Select, Modal, Badge } from "../components/ui";

const ROLE_OPTIONS = [{ value: "SELLER", label: "Продавец" }, { value: "ADMIN", label: "Администратор" }];
const STATUS = { COMPLETED: { label: "Завершён", variant: "green" }, CANCELLED: { label: "Отменён", variant: "red" }, RETURNED: { label: "Возврат", variant: "yellow" } };
const PAYMENT_LABELS = { CASH: "Наличные", CARD: "Карта", DEBT: "Долг", MIXED: "Смешанная" };

function UserDetailModal({ user, onEdit, onClose }) {
  const [sales, setSales] = useState([]);
  const [allTotal, setAllTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setSales([]);
    setAllTotal(0);
    Promise.all([
      api.get("/sales?limit=100").then(r => setSales(r.data.data.data.filter(s => s.user?.name === user.name))),
      api.get("/analytics/dashboard").then(r => setAllTotal(Number(r.data.data.month.amount))),
    ]).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const total = sales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
  const percent = allTotal > 0 ? ((total / allTotal) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Пользователь</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div className="flex items-center gap-4">
            {user.imageUrl
              ? <img src={user.imageUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
              : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">{user.name[0]}</div>
            }
            <div className="flex-1">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{user.name}</p>
              <p className="text-sm text-slate-400">{user.phone}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={user.role === "ADMIN" ? "purple" : "blue"}>{user.role === "ADMIN" ? "Админ" : "Продавец"}</Badge>
              <Badge variant={user.isActive ? "green" : "red"}>{user.isActive ? "Активен" : "Неактивен"}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Всего продаж</p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{sales.length}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Общая сумма</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{total.toLocaleString("ru-RU")} сом</p>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-2">Доля в месячных продажах</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: percent + "%" }} />
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{percent}%</span>
            </div>
          </div>

          {loading ? <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full" /></div> : (
            sales.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Продажи</p>
                <div className="space-y-2">
                  {sales.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{s.client?.name || "Неизвестно"}</p>
                        <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString("ru-RU")} · {PAYMENT_LABELS[s.paymentType]}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800 dark:text-white">{Number(s.totalAmount).toLocaleString("ru-RU")} сом</p>
                        <Badge variant={STATUS[s.status]?.variant}>{STATUS[s.status]?.label}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          <Button variant="outline" className="w-full" onClick={() => { onClose(); onEdit(user); }}>
            <Edit size={15} /> Редактировать
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", password: "", role: "SELLER", maxDiscountPercent: 0, canEditPrice: false });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/users"); setUsers(res.data.data); }
    catch { toast.error("Ошибка"); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", phone: "", password: "", role: "SELLER", maxDiscountPercent: 0, canEditPrice: false }); setImageFile(null); setImagePreview(null); setImageRemoved(false); setModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, phone: u.phone, password: "", role: u.role, maxDiscountPercent: u.maxDiscountPercent ?? 0, canEditPrice: u.canEditPrice ?? false }); setImageFile(null); setImagePreview(u.imageUrl || null); setImageRemoved(false); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = imageRemoved ? null : (editing?.imageUrl || null);
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = uploadRes.data.data.url;
      }
      const data = { ...form, imageUrl };
      if (editing && !data.password) delete data.password;
      if (editing) { await api.put("/users/" + editing.id, data); toast.success("Обновлено"); }
      else { await api.post("/users", data); toast.success("Создано"); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Ошибка"); }
    setSaving(false);
  };

  const handleForceLogout = async (e, u) => {
    e.stopPropagation();
    try { await api.post("/auth/force-logout/" + u.id); toast.success(u.name + " вышел из системы"); }
    catch { toast.error("Ошибка"); }
  };
  const handleToggle = async (e, u) => {
    e.stopPropagation();
    try { await api.put("/users/" + u.id, { isActive: !u.isActive }); toast.success(u.isActive ? "Отключён" : "Включён"); load(); }
    catch { toast.error("Ошибка"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Пользователи</h1>
        <Button onClick={openCreate}><Plus size={16} /> Добавить</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Имя","Телефон","Роль","Статус","Действия"].map((h,i) => (
                  <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (i >= 2 ? "text-center" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Пользователи не найдены</td></tr>
              ) : users.map(u => (
                <tr key={u.id} onClick={() => setSelected(u)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.imageUrl
                        ? <img src={u.imageUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{u.name[0]}</div>
                      }
                      <span className="font-medium text-slate-800 dark:text-slate-200">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.phone}</td>
                  <td className="px-4 py-3 text-center"><Badge variant={u.role === "ADMIN" ? "purple" : "blue"}>{u.role === "ADMIN" ? "Админ" : "Продавец"}</Badge></td>
                  <td className="px-4 py-3 text-center"><Badge variant={u.isActive ? "green" : "red"}>{u.isActive ? "Активен" : "Неактивен"}</Badge></td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={e => { e.stopPropagation(); openEdit(u); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg"><Edit size={15} /></button>
                      <button onClick={e => handleForceLogout(e, u)} title="Выйти из системы" className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg"><LogOut size={15} /></button>
                      <button onClick={e => handleToggle(e, u)} className={"p-1.5 rounded-lg " + (u.isActive ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10" : "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10")}><Power size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailModal user={selected} onClose={() => setSelected(null)} onEdit={openEdit} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Редактировать" : "Новый пользователь"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Input label="Телефон" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+998901234567" required />
          <Input label={editing ? "Новый пароль (необязательно)" : "Пароль"} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editing} />
          <Select label="Роль" value={form.role} onChange={e => setForm({...form, role: e.target.value})} options={ROLE_OPTIONS} />
          {form.role !== "ADMIN" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
              <Input label="Макс. скидка %" type="number" value={form.maxDiscountPercent} onChange={e => setForm({...form, maxDiscountPercent: e.target.value})} />
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 self-end pb-2 cursor-pointer">
                <input type="checkbox" checked={form.canEditPrice} onChange={e => setForm({...form, canEditPrice: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
                Может менять цену
              </label>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Фото</label>
            <input type="file" accept="image/*" onChange={e => { const file = e.target.files[0]; if (!file) return; setImageFile(file); setImagePreview(URL.createObjectURL(file)); setImageRemoved(false); }} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            {imagePreview && (
              <div className="relative w-20 h-20 mt-1">
                <img src={imagePreview} alt="preview" className="w-20 h-20 rounded-full object-cover" />
                <button type="button" title="Удалить фото" onClick={() => { setImageFile(null); setImagePreview(null); setImageRemoved(true); }} className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 shadow"><X size={12} /></button>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Отмена</Button>
            <Button type="submit" className="flex-1" loading={saving}>Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


