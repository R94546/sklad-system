import { useEffect, useState } from "react";
import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package, Send } from "lucide-react";
import ProductSearch from "../components/ProductSearch";
import AddToCartModal from "../components/AddToCartModal";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Button, Select, Input } from "../components/ui";
import api from "../api/axios";
import toast from "react-hot-toast";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Naqd" },
  { value: "CARD", label: "Karta" },
  { value: "DEBT", label: "Nasiya" },
  { value: "MIXED", label: "Aralash" },
];

const UNITS = { PIECE: "dona", KG: "kg", METER: "metr", LITER: "litr", BOX: "quti" };

function CartDetail({ cart, onConfirm, onRemoveItem, clients }) {
  const [form, setForm] = useState({ paymentType: "CASH", clientId: "", discount: 0, dueDate: "", debtAmount: "" });
  const [saving, setSaving] = useState(false);
  const clientOptions = clients.map(c => ({ value: c.id, label: c.name + " (" + c.phone + ")" }));
  const total = cart?.items?.reduce((s, i) => s + Number(i.price) * i.quantity, 0) || 0;
  const finalTotal = total - Number(form.discount || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Sotuvchi: <span className="font-medium text-slate-700 dark:text-slate-300">{cart.user?.name}</span></p>
          <p className="text-xs text-slate-400">{new Date(cart.createdAt).toLocaleString()}</p>
        </div>
        {cart.items.map(item => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
            {item.product?.imageUrl ? <img src={item.product.imageUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-slate-400" /></div>}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 dark:text-white truncate">{item.product?.name}</p>
              <p className="text-xs text-slate-400">{item.quantity} {UNITS[item.product?.unit]} × {Number(item.price).toLocaleString()} som</p>
            </div>
            <p className="font-bold text-slate-800 dark:text-white flex-shrink-0">{(item.quantity * Number(item.price)).toLocaleString()} som</p>
            <button onClick={() => onRemoveItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex-shrink-0"><Trash2 size={15} /></button>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 h-fit">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200">Tolov</h2>
        <Select label="Tolov turi" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
        <Select label="Mijoz" value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} options={clientOptions} placeholder="Tanlang" />
        {(form.paymentType === "DEBT" || form.paymentType === "MIXED") && (
          <>
            <Input label="Muddat" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
            {form.paymentType === "MIXED" && <Input label="Nasiya summasi" type="number" value={form.debtAmount} onChange={e => setForm({...form, debtAmount: e.target.value})} />}
          </>
        )}
        <Input label="Skidka (som)" type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} />
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Jami:</span>
            <span className="text-slate-700 dark:text-slate-300">{total.toLocaleString()} som</span>
          </div>
          {Number(form.discount) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Skidka:</span>
              <span className="text-red-500">-{Number(form.discount).toLocaleString()} som</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg mt-2">
            <span className="text-slate-800 dark:text-white">Natija:</span>
            <span className="text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString()} som</span>
          </div>
        </div>
        <Button variant="outline" className="w-full mb-2" onClick={async () => { try { await api.post("/sales/" + cart.id + "/send-to-kassa"); toast.success("Kassaga yuborildi"); window.location.reload(); } catch { toast.error("Xatolik"); } }}>
          <Send size={16} /> Kassaga yuborish
        </Button>
        <Button className="w-full" loading={saving} onClick={async () => { setSaving(true); await onConfirm(cart.id, form); setSaving(false); }}>
          <CheckCircle size={16} /> Sotishni tasdiqlash
        </Button>
      </div>
    </div>
  );
}

export default function Cart() {
  const [pendingSales, setPendingSales] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [cartProduct, setCartProduct] = useState(null);
  const { addToCart } = useCartStore();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === "ADMIN";
  const { removeItem } = useCartStore();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/sales");
      const all = r.data.data.data.filter(s => s.status === "PENDING");
      setPendingSales(isAdmin ? all : all.filter(s => s.user?.name === authUser?.name));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    api.get("/clients").then(r => setClients(r.data.data.data));
  }, []);

  const handleConfirm = async (cartId, form) => {
    try {
      await api.post("/sales/cart/" + cartId + "/confirm", form);
      toast.success("Sotuv amalga oshirildi");
      setSelected(null);
      load();
    } catch { toast.error("Xatolik"); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete("/sales/cart/item/" + itemId);
      const r = await api.get("/sales");
      const pending = r.data.data.data.filter(s => s.status === "PENDING");
      setPendingSales(pending);
      if (selected) setSelected(pending.find(s => s.id === selected.id) || null);
    } catch { toast.error("Xatolik"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {showSearch && <ProductSearch onClose={() => setShowSearch(false)} onSelect={(p) => { setShowSearch(false); setCartProduct(p); }} />}
      {cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity, price) => { const ok = await addToCart(productId, quantity, price); if (ok) { 
    toast.success(cartProduct.name + " savatga qoshildi"); 
    const r = await api.get("/sales");
    const pending = r.data.data.data.filter(s => s.status === "PENDING");
    setPendingSales(pending);
    if (selected) setSelected(pending.find(s => s.id === selected.id) || null);
  } else toast.error("Xatolik"); }} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savat</h1>
        <Button onClick={() => setShowSearch(true)}><Plus size={16} /> Mahsulot qoshish</Button>
      </div>

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            ← Orqaga
          </button>
          <CartDetail cart={selected} clients={clients} onConfirm={handleConfirm} onRemoveItem={handleRemoveItem} />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
          ) : pendingSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart size={40} className="text-slate-300 mb-4" />
              <p className="text-slate-400 mb-4">Savat bosh</p>
              <Button onClick={() => setShowSearch(true)}>Mahsulot qoshish</Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {pendingSales.map(sale => (
                <div key={sale.id} onClick={() => setSelected(sale)} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{sale.user?.name || "Sotuvchi"}</p>
                    <p className="text-xs text-slate-400">{sale.items?.length || 0} ta mahsulot · {new Date(sale.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{Number(sale.totalAmount).toLocaleString()} som</p>
                    <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Savat</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
