import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Package, X, ShoppingCart, Barcode, Scan, RefreshCw } from "lucide-react";
import useCartStore from "../store/cartStore";
import AddToCartModal from "../components/AddToCartModal";
import BarcodeScanner from "../components/BarcodeScanner";
import toast from "react-hot-toast";
import EmptyState from "../components/EmptyState";
import api from "../api/axios";
import { Button, Input, Select, Modal, Badge } from "../components/ui";

const UNITS = { PIECE: "dona", KG: "kg", METER: "metr", LITER: "litr", BOX: "quti" };
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
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mahsulot tafsiloti</h2>
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
              <Badge variant={product.quantity <= product.minStock ? "red" : "green"} className="mt-1">
                {product.quantity} {UNITS[product.unit]}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Sotish narxi</p>
              <p className="font-bold text-slate-800 dark:text-white">{Number(product.sellPrice).toLocaleString()} som</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Kirim narxi</p>
              <p className="font-bold text-slate-800 dark:text-white">{Number(product.buyPrice).toLocaleString()} som</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Qoldiq</p>
              <p className="font-bold text-slate-800 dark:text-white">{product.quantity} {UNITS[product.unit]}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Minimal qoldiq</p>
              <p className="font-bold text-slate-800 dark:text-white">{product.minStock} {UNITS[product.unit]}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 rounded-lg p-3 col-span-2">
              <p className="text-xs text-slate-400 mb-1">Umumiy qiymat</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400">{(Number(product.sellPrice) * product.quantity).toLocaleString()} som</p>
            </div>
          </div>
          {barcodeImg && (
            <div className="bg-white dark:bg-slate-700 rounded-lg p-3 flex flex-col items-center gap-2">
              <p className="text-xs text-slate-400">Barcode</p>
              <img src={barcodeImg} alt="barcode" className="h-16" />
              <p className="text-xs font-mono text-slate-500">{product.barcode}</p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { onClose(); onEdit(product); }}>
              <Edit size={15} /> Tahrirlash
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => { onClose(); onDelete(product.id); }}>
              <Trash2 size={15} /> Ochirish
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
  const [form, setForm] = useState({ name: "", categoryId: "", buyPrice: "", sellPrice: "", quantity: "", minStock: 10, unit: "PIECE", barcode: "" });

  const load = async () => {
    setLoading(true);
    try { const res = await api.get("/products?search=" + search); setProducts(res.data.data.data); }
    catch { toast.error("Xatolik"); }
    setLoading(false);
  };

  useEffect(() => { api.get("/categories").then(r => setCategories(r.data.data)); }, []);
  useEffect(() => { load(); }, [search]);

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
      toast.success("Barcode yaratildi");
    } catch { toast.error("Xatolik"); }
    setGeneratingBarcode(false);
  };

  const handleScanForSearch = async (barcode) => {
    setShowScanner(false);
    try {
      const res = await api.get("/barcode/scan/" + barcode);
      setSelected(res.data.data);
    } catch {
      toast.error("Tovar topilmadi: " + barcode);
      setSearch(barcode);
    }
  };

  const handleScanForForm = (barcode) => {
    setShowScanner(false);
    setForm(f => ({ ...f, barcode }));
  };

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
      let imageUrl = editing?.imageUrl || null;
      if (imageFile) {
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadRes = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
        imageUrl = uploadRes.data.data.url;
      }
      if (editing) { await api.put("/products/" + editing.id, { ...form, imageUrl }); toast.success("Yangilandi"); }
      else { await api.post("/products", { ...form, imageUrl }); toast.success("Yaratildi"); }
      setModal(false); setImageFile(null); setImagePreview(null); load();
    } catch (err) { toast.error(err.response?.data?.message || "Xatolik"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Ochirmoqchimisiz?")) return;
    try { await api.delete("/products/" + id); toast.success("Ochirildi"); load(); }
    catch { toast.error("Xatolik"); }
  };

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mahsulotlar</h1>
        <Button onClick={openCreate}><Plus size={16} /> Qoshish</Button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Qidirish..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Button variant="outline" onClick={() => { setScannerTarget("search"); setShowScanner(true); }}>
          <Scan size={16} /> Skaner
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                {["Nomi", "Narxi", "Qoldiq", ""].map((h, i) => (
                  <th key={i} className={"px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider " + (i >= 1 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={99} className="py-2"><EmptyState type="products" title="Mahsulotlar topilmadi" desc="Yangi mahsulot qoshish uchun + tugmasini bosing" /></td></tr>
              ) : products.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center"><Package size={18} className="text-slate-400" /></div>}
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200 block max-w-[120px] truncate">{p.name}</span>
                        {p.barcode && <span className="text-xs font-mono text-slate-400">{p.barcode}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-white">{Number(p.sellPrice).toLocaleString()} som</td>
                  <td className="px-4 py-3 text-right"><Badge variant={p.quantity <= p.minStock ? "red" : "green"}>{p.quantity} {UNITS[p.unit]}</Badge></td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setCartProduct(p)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg">
                      <ShoppingCart size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={scannerTarget === "search" ? handleScanForSearch : handleScanForForm}
          onClose={() => setShowScanner(false)}
        />
      )}

      {cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity) => { const ok = await addToCart(productId, quantity); if (ok) toast.success(cartProduct.name + " savatga qoshildi"); else toast.error("Xatolik"); }} />}
      <ProductDetailModal product={selected} onClose={() => setSelected(null)} onEdit={openEdit} onDelete={handleDelete} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nomi" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          <Select label="Kategoriya" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})} options={categoryOptions} placeholder="Kategoriya tanlang" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kirim narxi" type="number" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} required />
            <Input label="Sotish narxi" type="number" value={form.sellPrice} onChange={e => setForm({...form, sellPrice: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Miqdor" type="number" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
            <Select label="Birlik" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} options={UNIT_OPTIONS} />
          </div>
          <Input label="Minimal qoldiq" type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Barcode</label>
            <div className="flex gap-2">
              <Input value={form.barcode} onChange={e => setForm({...form, barcode: e.target.value})} placeholder="Barcode (ixtiyoriy)" className="flex-1" />
              <Button type="button" variant="outline" onClick={() => { setScannerTarget("form"); setShowScanner(true); }} title="Skaner">
                <Scan size={15} />
              </Button>
              <Button type="button" variant="outline" onClick={generateBarcode} loading={generatingBarcode} title="Generatsiya">
                <RefreshCw size={15} />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Rasm</label>
            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            {imagePreview && <img src={imagePreview} alt="preview" className="w-full h-40 object-cover rounded-lg mt-1" />}
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
