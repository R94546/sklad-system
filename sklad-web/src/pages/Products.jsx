import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package, X, ShoppingCart, Scan, RefreshCw } from "lucide-react";
import useCartStore from "../store/cartStore";
import AddToCartModal from "../components/AddToCartModal";
import BarcodeScanner from "../components/BarcodeScanner";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import ViewToggle from "../components/ViewToggle";
import { getSavedView, saveView } from "../utils/viewPref";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import api from "../api/axios";
import { Button, Input, Select, Modal, Badge } from "../components/ui";

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };
const UNIT_OPTIONS = Object.entries(UNITS).map(([value, label]) => ({ value, label }));

function ProductDetailModal({ product, onEdit, onDelete, onClose }) {
  const [barcodeImg, setBarcodeImg] = useState(null);
  useEffect(() => {
    if (product?.barcode) {
      api.get("/barcode/image/" + product.barcode).then(r => setBarcodeImg(r.data.data.image)).catch(() => {});
    }
  }, [product]);
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">О товаре</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-20 h-20 rounded-xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <Package size={32} className="text-slate-400" />
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-slate-800 dark:text-white">{product.name}</p>
              <p className="text-sm text-slate-400">{product.category?.name}</p>
              <Badge variant={Number(product.quantity) <= Number(product.minStock) ? "red" : "green"} className="mt-1">
                {product.quantity} {UNITS[product.unit]}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Цена продажи</p>
              <p className="font-bold text-slate-800 dark:text-white">{Number(product.sellPrice).toLocaleString("ru-RU")} сом</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Цена прихода</p>
              <p className="font-bold text-slate-800 dark:text-white">{Number(product.buyPrice).toLocaleString("ru-RU")} сом</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Остаток</p>
              <p className="font-bold text-slate-800 dark:text-white">{product.quantity} {UNITS[product.unit]}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Мин. остаток</p>
              <p className="font-bold text-slate-800 dark:text-white">{product.minStock} {UNITS[product.unit]}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-1">Общая стоимость</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400">{(Number(product.sellPrice) * product.quantity).toLocaleString("ru-RU")} сом</p>
            </div>
          </div>
          {barcodeImg && (
            <div className="bg-white dark:bg-slate-700 rounded-lg p-3 flex flex-col items-center gap-2">
              <p className="text-xs text-slate-400">Штрихкод</p>
              <img src={barcodeImg} alt="barcode" className="h-16" />
              <p className="text-xs font-mono text-slate-500">{product.barcode}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { onClose(); onEdit(product); }}>
              <Edit size={15} /> Редактировать
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => { onClose(); onDelete(product.id); }}>
              <Trash2 size={15} /> Удалить
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);
  const { addToCart } = useCartStore();
  const [cartProduct, setCartProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatingBarcode, setGeneratingBarcode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [view, setView] = useState(() => getSavedView("products", "grid"));
  const [form, setForm] = useState({ name: "", categoryId: "", buyPrice: "", sellPrice: "", quantity: "", minStock: 10, unit: "PIECE", barcode: "" });

  const changeView = (v) => { setView(v); saveView("products", v); };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryId) params.set("categoryId", categoryId);
      const res = await api.get("/products?" + params.toString());
      setProducts(res.data.data.data);
    } catch { toast.error("Ошибка"); }
    setLoading(false);
  };

  useEffect(() => { api.get("/categories").then(r => setCategories(r.data.data)); }, []);
  // Debounce: запрос только через 350мс после последнего ввода / смены категории
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const generateBarcode = async () => {
    setGeneratingBarcode(true);
    try {
      const res = await api.get("/barcode/generate");
      setForm(f => ({ ...f, barcode: res.data.data.barcode }));
      toast.success("Штрихкод создан");
    } catch { toast.error("Ошибка"); }
    setGeneratingBarcode(false);
  };

  const handleScanForSearch = async (barcode) => {
    setShowScanner(false);
    try {
      const res = await api.get("/barcode/scan/" + barcode);
      setSelected(res.data.data);
    } catch {
      toast.error("Товар не найден: " + barcode);
      setSearch(barcode);
    }
  };

  const handleScanForForm = (barcode) => {
    setShowScanner(false);
    setForm(f => ({ ...f, barcode }));
  };

  // Сканер-пистолет: в форме товара — заполняет штрихкод, иначе — ищет товар
  useBarcodeScanner((code) => {
    if (modal) { setForm(f => ({ ...f, barcode: code })); toast.success("Штрихкод считан"); }
    else { setSearch(""); handleScanForSearch(code); }
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", categoryId: "", buyPrice: "", sellPrice: "", quantity: "", minStock: 10, unit: "PIECE", barcode: "" });
    setImageFile(null); setImagePreview(null); setModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({ name: p.name, categoryId: p.categoryId, buyPrice: p.buyPrice, sellPrice: p.sellPrice, quantity: p.quantity, minStock: p.minStock, unit: p.unit, barcode: p.barcode || "" });
    setImageFile(null); setImagePreview(p.imageUrl || null); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // imagePreview === null означает, что фото удалили в форме
      let imageUrl = imagePreview ? (editing?.imageUrl || null) : null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = uploadRes.data.data.url;
      }
      if (editing) { await api.put("/products/" + editing.id, { ...form, imageUrl }); toast.success("Обновлено"); }
      else { await api.post("/products", { ...form, imageUrl }); toast.success("Создано"); }
      setModal(false); setImageFile(null); setImagePreview(null); load();
    } catch (err) { toast.error(err.response?.data?.message || "Ошибка"); }
    setSaving(false);
  };

  const handleDelete = (id) => setConfirmDelete(id);
  const doDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try { await api.delete("/products/" + id); toast.success("Удалено"); load(); }
    catch { toast.error("Ошибка"); }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Товары</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={view} onChange={changeView} />
          <Button onClick={openCreate}><Plus size={16} /> Добавить</Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Поиск товаров..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" onClick={() => { setScannerTarget("search"); setShowScanner(true); }}>
          <Scan size={16} /> Сканер
        </Button>
      </div>

      {/* Фильтр-чипы категорий (стиль Odoo) */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategoryId("")}
          className={"px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors " + (categoryId === "" ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700")}>
          Все
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => setCategoryId(c.id)}
            className={"px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors " + (categoryId === c.id ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700")}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Kanban-карточки товаров (стиль Odoo) */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState type="products" title="Товары не найдены" desc="Нажмите «Добавить» чтобы создать товар" />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => {
            const low = Number(p.quantity) <= Number(p.minStock);
            return (
              <div key={p.id} onClick={() => setSelected(p)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex gap-3 cursor-pointer hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight line-clamp-2">{p.name}</p>
                  {p.barcode && <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">[{p.barcode}]</p>}
                  <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-2">{Number(p.sellPrice).toLocaleString("ru-RU")} сом</p>
                  <p className={"text-[11px] mt-1 font-medium " + (low ? "text-red-500" : "text-slate-400")}>
                    В наличии: {p.quantity} {UNITS[p.unit]}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between flex-shrink-0">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-lg object-cover" />
                    : <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Package size={24} className="text-slate-400" /></div>}
                  <button onClick={(e) => { e.stopPropagation(); setCartProduct(p); }}
                    className="mt-2 p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="В чек">
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Товар</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Штрихкод</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Категория</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Цена</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">В наличии</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {products.map(p => {
                  const low = Number(p.quantity) <= Number(p.minStock);
                  return (
                    <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                            : <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-slate-400" /></div>}
                          <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-400 hidden md:table-cell">{p.barcode || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 hidden md:table-cell">{p.category?.name || "—"}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">{Number(p.sellPrice).toLocaleString("ru-RU")} сом</td>
                      <td className={"px-4 py-2.5 text-right tabular-nums font-medium " + (low ? "text-red-500" : "text-slate-600 dark:text-slate-300")}>{p.quantity} {UNITS[p.unit]}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={(e) => { e.stopPropagation(); setCartProduct(p); }}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg" title="В чек">
                          <ShoppingCart size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={scannerTarget === "search" ? handleScanForSearch : handleScanForForm}
          onClose={() => setShowScanner(false)}
        />
      )}

      {cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity) => { const ok = await addToCart(productId, quantity); if (ok) toast.success(cartProduct.name + " добавлен в корзину"); else toast.error("Ошибка"); }} />}
      <ProductDetailModal product={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Удалить товар?" size="sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">Товар будет деактивирован и скрыт из каталога.</p>
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>Отмена</Button>
          <Button type="button" variant="danger" className="flex-1" onClick={doDelete}>Удалить</Button>
        </div>
      </Modal>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Редактировать товар" : "Новый товар"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Select label="Категория" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} options={categoryOptions} placeholder="Выберите категорию" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Цена прихода" type="number" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} required />
            <Input label="Цена продажи" type="number" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} required />
          </div>
          {form.buyPrice !== "" && form.sellPrice !== "" && Number(form.sellPrice) < Number(form.buyPrice) && (
            <p className="text-xs text-amber-500">⚠ Цена продажи ниже цены прихода — продажа в убыток</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Количество" type="number" step="any" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Select label="Единица" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} options={UNIT_OPTIONS} />
          </div>
          <Input label="Мин. остаток" type="number" step="any" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Штрихкод</label>
            <div className="flex gap-2">
              <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Штрихкод (необязательно)" className="flex-1" />
              <Button type="button" variant="outline" onClick={() => { setScannerTarget("form"); setShowScanner(true); }} title="Сканер">
                <Scan size={15} />
              </Button>
              <Button type="button" variant="outline" onClick={generateBarcode} loading={generatingBarcode} title="Сгенерировать">
                <RefreshCw size={15} />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Фото</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            {imagePreview && (
              <div className="relative mt-1">
                <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full p-1.5" title="Удалить фото">
                  <Trash2 size={15} />
                </button>
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
