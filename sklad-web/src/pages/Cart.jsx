import { useEffect, useState } from "react";
import { Trash2, ShoppingCart, CheckCircle, Plus, X, Package, Send, UserPlus, Scan } from "lucide-react";
import ProductSearch from "../components/ProductSearch";
import AddToCartModal from "../components/AddToCartModal";
import BarcodeScanner from "../components/BarcodeScanner";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { Button, Select, Input } from "../components/ui";
import api from "../api/axios";
import toast from "react-hot-toast";

const PAYMENT_OPTIONS = [
  { value: "CASH", label: "Наличные" },
  { value: "CARD", label: "Карта" },
  { value: "DEBT", label: "Долг" },
  { value: "MIXED", label: "Смешанная" },
];

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };

function QuickAddClientModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const handle = async () => {
    if (!form.name || !form.phone) return toast.error("Введите имя и телефон");
    setSaving(true);
    try {
      const r = await api.post("/clients", form);
      toast.success("Клиент добавлен");
      onAdded(r.data.data);
      onClose();
    } catch { toast.error("Ошибка"); }
    setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white">Новый клиент</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <Input label="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Имя клиента" />
        <Input label="Телефон" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+996700000000" />
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Отмена</Button>
          <Button className="flex-1" loading={saving} onClick={handle}>Сохранить</Button>
        </div>
      </div>
    </div>
  );
}

function CartDetail({ cart, onConfirm, onRemoveItem, clients, onClientsUpdate, isAdmin }) {
  const [form, setForm] = useState({ paymentType: "CASH", clientId: "", discount: 0, discountType: "AMOUNT", dueDate: "", debtAmount: "" });
  const [saving, setSaving] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const clientOptions = clients.map(c => ({ value: c.id, label: c.name + " (" + c.phone + ")" }));
  const total = cart?.items?.reduce((s, i) => s + Number(i.price) * i.quantity, 0) || 0;
  const discountAmount = form.discountType === "PERCENT" ? (total * Number(form.discount || 0) / 100) : Number(form.discount || 0);
  const finalTotal = total - discountAmount;

  return (
    <>
      {showAddClient && (
        <QuickAddClientModal
          onClose={() => setShowAddClient(false)}
          onAdded={(client) => { onClientsUpdate(client); setForm({...form, clientId: client.id}); }}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Продавец: <span className="font-medium text-slate-700 dark:text-slate-300">{cart.user?.name}</span></p>
            <p className="text-xs text-slate-400">{new Date(cart.createdAt).toLocaleString("ru-RU")}</p>
          </div>
          {cart.items.map(item => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-4">
              {item.product?.imageUrl ? <img src={item.product.imageUrl} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0"><Package size={16} className="text-slate-400" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white truncate">{item.product?.name}</p>
                <p className="text-xs text-slate-400">{item.quantity} {UNITS[item.product?.unit]} × {Number(item.price).toLocaleString("ru-RU")} сом</p>
              </div>
              <p className="font-bold text-slate-800 dark:text-white flex-shrink-0">{(item.quantity * Number(item.price)).toLocaleString("ru-RU")} сом</p>
              <button onClick={() => onRemoveItem(item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex-shrink-0"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 space-y-4 h-fit">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Оплата</h2>
          <Select label="Способ оплаты" value={form.paymentType} onChange={e => setForm({...form, paymentType: e.target.value})} options={PAYMENT_OPTIONS} />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Клиент</label>
            <div className="flex gap-2">
              <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Выберите</option>
                {clientOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={() => setShowAddClient(true)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 flex-shrink-0" title="Новый клиент">
                <UserPlus size={16} />
              </button>
            </div>
          </div>
          {(form.paymentType === "DEBT" || form.paymentType === "MIXED") && (
            <>
              <Input label="Срок" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
              {form.paymentType === "MIXED" && <Input label="Сумма долга" type="number" value={form.debtAmount} onChange={e => setForm({...form, debtAmount: e.target.value})} />}
            </>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Скидка</label>
            <div className="flex gap-2">
              <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="AMOUNT">сом</option>
                <option value="PERCENT">%</option>
              </select>
              <input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none" placeholder="0" />
            </div>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Сумма:</span>
              <span className="text-slate-700 dark:text-slate-300">{total.toLocaleString("ru-RU")} сом</span>
            </div>
            {Number(form.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Скидка:</span>
                <span className="text-red-500">−{discountAmount.toLocaleString("ru-RU")} сом {form.discountType === "PERCENT" ? "(" + form.discount + "%)" : ""}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span className="text-slate-800 dark:text-white">Итого:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{finalTotal.toLocaleString("ru-RU")} сом</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={async () => { try { await api.post("/sales/" + cart.id + "/send-to-kassa"); toast.success("Отправлено на кассу"); window.location.reload(); } catch { toast.error("Ошибка"); } }}>
            <Send size={16} /> Отправить на кассу
          </Button>
          {isAdmin && (
            <Button className="w-full mt-2" loading={saving} onClick={async () => { setSaving(true); await onConfirm(cart.id, form); setSaving(false); }}>
              <CheckCircle size={16} /> Подтвердить продажу
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default function Cart() {
  const [pendingSales, setPendingSales] = useState([]);
  const [selected, setSelected] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [cartProduct, setCartProduct] = useState(null);
  const { addToCart } = useCartStore();
  const { user: authUser } = useAuthStore();
  const isAdmin = authUser?.role === "ADMIN";
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/sales");
      const all = r.data.data.data.filter(s => s.status === "PENDING");
      setPendingSales(isAdmin ? all : all.filter(s => s.user?.name === authUser?.name));
    } catch { /* игнорируем */ }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    api.get("/clients").then(r => setClients(r.data.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (barcode) => {
    setShowScanner(false);
    try {
      const res = await api.get("/barcode/scan/" + barcode);
      setCartProduct(res.data.data);
    } catch {
      toast.error("Товар не найден: " + barcode);
    }
  };

  const handleConfirm = async (cartId, form) => {
    try {
      await api.post("/sales/cart/" + cartId + "/confirm", form);
      toast.success("Продажа оформлена");
      setSelected(null);
      load();
    } catch { toast.error("Ошибка"); }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete("/sales/cart/item/" + itemId);
      const r = await api.get("/sales");
      const pending = r.data.data.data.filter(s => s.status === "PENDING");
      setPendingSales(pending);
      if (selected) setSelected(pending.find(s => s.id === selected.id) || null);
    } catch { toast.error("Ошибка"); }
  };

  // navigate сохранён для возможной навигации
  void navigate;

  return (
    <div className="space-y-6 animate-fade-in">
      {showSearch && <ProductSearch onClose={() => setShowSearch(false)} onSelect={(p) => { setShowSearch(false); setCartProduct(p); }} />}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
      {cartProduct && <AddToCartModal product={cartProduct} onClose={() => setCartProduct(null)} onAdd={async (productId, quantity, price) => { const ok = await addToCart(productId, quantity, price); if (ok) { toast.success(cartProduct.name + " добавлен в корзину"); const r = await api.get("/sales"); const pending = r.data.data.data.filter(s => s.status === "PENDING"); setPendingSales(pending); if (selected) setSelected(pending.find(s => s.id === selected.id) || null); } else toast.error("Ошибка"); }} />}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Корзина</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScanner(true)}><Scan size={16} /> Сканер</Button>
          <Button onClick={() => setShowSearch(true)}><Plus size={16} /> Добавить товар</Button>
        </div>
      </div>

      {selected ? (
        <div className="space-y-4">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">← Назад</button>
          <CartDetail
            cart={selected}
            clients={clients}
            onConfirm={handleConfirm}
            onRemoveItem={handleRemoveItem}
            onClientsUpdate={(newClient) => setClients(prev => [...prev, newClient])}
            isAdmin={isAdmin}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto" /></div>
          ) : pendingSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <ShoppingCart size={40} className="text-slate-300 mb-4" />
              <p className="text-slate-400 mb-4">Корзина пуста</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowScanner(true)}><Scan size={16} /> Сканер</Button>
                <Button onClick={() => setShowSearch(true)}>Добавить товар</Button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {pendingSales.map(sale => (
                <div key={sale.id} onClick={() => setSelected(sale)} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-200">{sale.user?.name || "Продавец"}</p>
                    <p className="text-xs text-slate-400">{sale.items?.length || 0} тов. · {new Date(sale.createdAt).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{Number(sale.totalAmount).toLocaleString("ru-RU")} сом</p>
                    <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">Корзина</span>
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
