import { useEffect, useState } from "react";
import api from "../api/axios";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";
import { Button, Input, Modal } from "../components/ui";
import { Plus, Trash2 } from "lucide-react";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/categories"); setCategories(res.data.data); }
    catch { toast.error("Ошибка"); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setName(""); setModal(true); };
  const openEdit = (c) => { setEditing(c); setName(c.name); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Введите название");
    setSaving(true);
    try {
      if (editing) { await api.put("/categories/" + editing.id, { name }); toast.success("Обновлено"); }
      else { await api.post("/categories", { name }); toast.success("Создано"); }
      setModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || "Ошибка"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Удалить категорию?")) return;
    try { await api.delete("/categories/" + id); toast.success("Удалено"); load(); }
    catch (err) { toast.error(err.response?.data?.message || "Ошибка"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Категории</h1>
        <Button onClick={openCreate}><Plus size={16} /> Добавить</Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : categories.length === 0 ? (
          <EmptyState type="categories" title="Категории не найдены" />
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {categories.map(c => (
              <div key={c.id} onClick={() => openEdit(c)} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                <button onClick={e => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Редактировать" : "Новая категория"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Название категории" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          <div className="flex gap-3 pt-2">
            {editing && <Button type="button" variant="danger" onClick={() => { setModal(false); handleDelete(editing.id); }}>Удалить</Button>}
            <Button type="button" variant="outline" className="flex-1" onClick={() => setModal(false)}>Отмена</Button>
            <Button type="submit" className="flex-1" loading={saving}>Сохранить</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
