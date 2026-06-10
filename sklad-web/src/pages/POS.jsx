import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Trash2, Package, X, ScanLine, User, Plus, Menu, Delete,
  FileText, Upload, MoreVertical, RefreshCw, Moon, Sun,
  Boxes, Wrench, Hammer, ShoppingBag, Tag, LayoutGrid, Sofa, Check,
  Banknote, CreditCard, Wallet, ArrowLeft, Printer, Send, LogOut,
} from "lucide-react";
import printJS from "print-js";
import api from "../api/axios";
import useCartStore from "../store/cartStore";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import BarcodeScanner from "../components/BarcodeScanner";
import OrdersView from "../components/OrdersView";
import { OpenSessionModal, CloseSessionModal, CashMovementModal } from "../components/SessionModals";
import toast from "react-hot-toast";

const UNITS = { PIECE: "шт", KG: "кг", METER: "м", LITER: "л", BOX: "кор" };
const CAT_COLORS = ["#1D9E75", "#D4537E", "#378ADD", "#BA7517", "#7F77DD", "#D85A30", "#639922", "#0F6E56"];
const CAT_ICONS = [Boxes, Sofa, Wrench, Hammer, ShoppingBag, Tag, LayoutGrid, Package];
const AVATAR_COLORS = ["#B33A3A", "#714B67", "#1D6A96", "#1D9E75", "#9A6324", "#3F51B5"];
const QUICK_SUMS = [100, 500, 1000];
const PAY_METHODS = [
  { value: "CASH", label: "Наличные", Icon: Banknote },
  { value: "CARD", label: "Карта", Icon: CreditCard },
  { value: "DEBT", label: "Долг (счёт клиента)", Icon: Wallet },
];
const fmt = (n) => Math.round(Number(n) || 0).toLocaleString("ru-RU");

export default function POS() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const { cart, carts, activeId, loadCarts, newCart, switchCart, addToCart, removeItem, patchItem, confirmCart } = useCartStore();

  const [view, setView] = useState("register"); // register | payment
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const searchRef = useRef(null);

  // Цифровая клавиатура чека
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [mode, setMode] = useState("QTY"); // QTY | PRICE | PERCENT
  const [buffer, setBuffer] = useState("");
  const [fresh, setFresh] = useState(true);

  // Модальные окна / меню
  const [showScanner, setShowScanner] = useState(false);
  const [showClient, setShowClient] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Чек
  const [selectedClient, setSelectedClient] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Экран оплаты
  const [payments, setPayments] = useState([]); // [{id, method, amount}]
  const [activePayId, setActivePayId] = useState(null);
  const [payBuffer, setPayBuffer] = useState("");
  const [payFresh, setPayFresh] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const payIdRef = useRef(1);

  // Чек после оплаты (экран подтверждения)
  const [lastSale, setLastSale] = useState(null);

  // Смена (касса)
  const [session, setSession] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showCashMove, setShowCashMove] = useState(false);

  const loadProducts = async () => {
    const r = await api.get("/products?limit=500");
    setProducts(r.data.data.data || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [p, c, cl, ses] = await Promise.all([
          api.get("/products?limit=500"),
          api.get("/categories"),
          api.get("/clients"),
          api.get("/sessions/current"),
        ]);
        setProducts(p.data.data.data || []);
        setCategories(c.data.data.data || c.data.data || []);
        setClients(cl.data.data.data || []);
        setSession(ses.data.data || null);
      } catch {
        toast.error("Ошибка загрузки данных");
      }
      setSessionLoaded(true);
      setLoading(false);
      loadCarts();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = cart?.items || [];
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // Лимиты продавца
  const isAdmin = user?.role === "ADMIN";
  const maxDisc = Number(user?.maxDiscountPercent) || 0;
  const canEditPrice = isAdmin || !!user?.canEditPrice;

  const filtered = useMemo(() => {
    let list = products;
    if (activeCat) list = list.filter((p) => p.categoryId === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode || "").includes(q));
    }
    return list;
  }, [products, activeCat, search]);

  const catColor = (id) => {
    const i = categories.findIndex((c) => c.id === id);
    return CAT_COLORS[(i < 0 ? 0 : i) % CAT_COLORS.length];
  };
  const catIcon = (id) => {
    const i = categories.findIndex((c) => c.id === id);
    return CAT_ICONS[(i < 0 ? 0 : i) % CAT_ICONS.length];
  };
  const qtyInCart = (pid) => items.find((i) => i.productId === pid)?.quantity || 0;

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = total - paid;
  const change = paid > total ? paid - total : 0;

  // ===== Товары → корзина =====
  const handleAdd = async (p) => {
    if (p.quantity <= 0) return toast.error(p.name + " — нет в наличии");
    const ok = await addToCart(p.id, 1, p.sellPrice);
    if (!ok) toast.error("Ошибка");
  };

  const handleSearchEnter = async (e) => {
    if (e.key !== "Enter") return;
    const code = search.trim();
    const exact = products.find((p) => p.barcode === code);
    if (exact) { await handleAdd(exact); setSearch(""); }
    else if (filtered.length === 1) { await handleAdd(filtered[0]); setSearch(""); }
    else if (filtered.length === 0) toast.error("Товар не найден");
  };

  const handleScan = async (code) => {
    setShowScanner(false);
    const local = products.find((p) => p.barcode === code);
    if (local) return handleAdd(local);
    try {
      const r = await api.get("/barcode/scan/" + code);
      const p = r.data.data;
      if (p) { await addToCart(p.id, 1, p.sellPrice); toast.success(p.name + " добавлен"); }
    } catch {
      toast.error("Товар не найден: " + code);
    }
  };

  // ===== Клавиатура чека =====
  const selectLine = (id) => {
    setSelectedItemId((prev) => (prev === id ? null : id));
    setMode("QTY");
    setBuffer("");
    setFresh(true);
  };
  const changeMode = (m) => {
    if (m === "PRICE" && !canEditPrice) return toast.error("Нет прав менять цену");
    if (m === "PERCENT" && !isAdmin && maxDisc <= 0) return toast.error("Скидки запрещены");
    if (m === "PERCENT" && !isAdmin) toast("Макс. скидка: " + maxDisc + "%", { icon: "ℹ️" });
    setMode(m); setBuffer(""); setFresh(true);
  };

  const applyBuffer = (b) => {
    if (!selectedItem) return;
    const num = parseFloat((b || "0").replace(",", ".")) || 0;
    if (mode === "QTY") patchItem(selectedItem.id, { quantity: Math.max(0, Math.round(num)) });
    else if (mode === "PRICE") patchItem(selectedItem.id, { price: Math.max(0, num) });
    else if (mode === "PERCENT") {
      let pct = num;
      if (!isAdmin) pct = Math.min(Math.max(0, pct), maxDisc); // лимит скидки продавца
      const base = Number(selectedItem.product?.sellPrice) || Number(selectedItem.price) || 0;
      patchItem(selectedItem.id, { price: Math.max(0, Math.round(base * (1 - pct / 100))) });
    }
  };

  const press = (k) => {
    if (!selectedItem) return toast.error("Выберите позицию в чеке");
    let b = fresh ? "" : buffer;
    if (k === "back") b = b.slice(0, -1);
    else if (k === "pm") b = b.startsWith("-") ? b.slice(1) : "-" + b;
    else if (k === ",") { if (!b.includes(".")) b = (b || "0") + "."; }
    else b = b + k;
    setFresh(false);
    setBuffer(b);
    applyBuffer(b);
  };

  const modeValue = (m) => {
    if (!selectedItem) return "";
    // Для % всегда показываем фактическую скидку из цены (учитывает лимит-кламп)
    if (m === "PERCENT") {
      const base = Number(selectedItem.product?.sellPrice) || 0;
      return base > 0 ? String(Math.round((1 - Number(selectedItem.price) / base) * 100)) : "0";
    }
    if (mode === m && !fresh && buffer !== "") return buffer;
    if (m === "QTY") return String(selectedItem.quantity);
    if (m === "PRICE") return fmt(selectedItem.price);
    return "";
  };

  const clearCart = async () => {
    for (const it of items) await removeItem(it.id);
    setSelectedItemId(null);
  };

  const reloadData = async () => {
    setMenuOpen(false);
    try {
      const [p, c, cl] = await Promise.all([
        api.get("/products?limit=500"),
        api.get("/categories"),
        api.get("/clients"),
      ]);
      setProducts(p.data.data.data || []);
      setCategories(c.data.data.data || c.data.data || []);
      setClients(cl.data.data.data || []);
      loadCarts();
      toast.success("Данные обновлены");
    } catch { toast.error("Ошибка"); }
  };

  // ===== Экран оплаты =====
  const openPayment = () => {
    if (!items.length) return toast.error("Чек пуст");
    setPayments([]);
    setActivePayId(null);
    setPayBuffer("");
    setPayFresh(true);
    setView("payment");
  };

  const addPayment = (method) => {
    const rem = Math.max(0, total - payments.reduce((s, p) => s + p.amount, 0));
    const id = payIdRef.current++;
    setPayments((ps) => [...ps, { id, method, amount: rem }]);
    setActivePayId(id);
    setPayBuffer(String(Math.round(rem)));
    setPayFresh(true);
    if (method === "DEBT" && !selectedClient) toast("Выберите клиента для долга", { icon: "👤" });
  };

  const selectPayment = (id) => {
    const p = payments.find((x) => x.id === id);
    setActivePayId(id);
    setPayBuffer(String(Math.round(p?.amount || 0)));
    setPayFresh(true);
  };

  const removePayment = (id) => {
    setPayments((ps) => ps.filter((p) => p.id !== id));
    if (activePayId === id) { setActivePayId(null); setPayBuffer(""); setPayFresh(true); }
  };

  const setActiveAmount = (amount) => {
    setPayments((ps) => ps.map((p) => (p.id === activePayId ? { ...p, amount: Math.max(0, amount) } : p)));
  };

  const pressPay = (k) => {
    if (!activePayId) return toast.error("Выберите способ оплаты");
    let b = payFresh ? "" : payBuffer;
    if (k === "back") b = b.slice(0, -1);
    else if (k === ",") { if (!b.includes(".")) b = (b || "0") + "."; }
    else b = b + k;
    setPayFresh(false);
    setPayBuffer(b);
    setActiveAmount(parseFloat((b || "0").replace(",", ".")) || 0);
  };

  const addQuick = (n) => {
    if (!activePayId) return toast.error("Выберите способ оплаты");
    const cur = payments.find((p) => p.id === activePayId);
    const na = Math.max(0, Math.round((cur?.amount || 0) + n));
    setActiveAmount(na);
    setPayBuffer(String(na));
    setPayFresh(true);
  };

  const handleConfirm = async () => {
    if (!items.length) return toast.error("Чек пуст");
    if (paid < total) return toast.error("Внесённая сумма меньше итога");
    const hasDebt = payments.some((p) => p.method === "DEBT");
    const debtSum = payments.filter((p) => p.method === "DEBT").reduce((s, p) => s + p.amount, 0);
    const nonDebt = payments.filter((p) => p.method !== "DEBT").reduce((s, p) => s + p.amount, 0);
    let paymentType, debtAmount = 0;
    if (hasDebt) {
      if (!selectedClient) return toast.error("Выберите клиента для долга");
      paymentType = nonDebt > 0 ? "MIXED" : "DEBT";
      debtAmount = debtSum;
    } else {
      const hasCard = payments.some((p) => p.method === "CARD");
      const hasCash = payments.some((p) => p.method === "CASH");
      paymentType = hasCard && !hasCash ? "CARD" : "CASH";
    }
    const snapshot = {
      items: items.map((i) => ({ name: i.product?.name || "Товар", qty: i.quantity, price: Number(i.price) })),
      total, change, paymentType,
      number: cart?.number || null,
      client: selectedClient || null,
      seller: user?.name || "",
      note,
      date: new Date().toLocaleString("ru-RU"),
    };
    setSaving(true);
    const ok = await confirmCart({ paymentType, clientId: selectedClient?.id || "", dueDate, debtAmount, note });
    setSaving(false);
    if (ok) {
      setLastSale(snapshot);
      setView("receipt");
      setPayments([]);
      setActivePayId(null);
      setSelectedItemId(null);
      loadProducts();
    } else toast.error("Ошибка оформления");
  };

  // Печать чека (print-js)
  const printReceipt = () => {
    const s = lastSale;
    if (!s) return;
    const rows = s.items.map((i) =>
      `<tr><td style="padding:2px 0">${i.name}</td><td style="text-align:center">${i.qty}</td><td style="text-align:right">${fmt(i.price * i.qty)}</td></tr>`
    ).join("");
    const html = `<div style="font-family:monospace;width:280px;color:#000">
      <h3 style="text-align:center;margin:4px 0">Sklad</h3>
      <div style="font-size:12px">Чек #${s.number || "—"} · ${s.date}</div>
      <div style="font-size:12px">Продавец: ${s.seller}</div>
      ${s.client ? `<div style="font-size:12px">Клиент: ${s.client.name}</div>` : ""}
      ${s.note ? `<div style="font-size:12px">Заметка: ${s.note}</div>` : ""}
      <hr/>
      <table style="width:100%;font-size:12px;border-collapse:collapse">${rows}</table>
      <hr/>
      <div style="text-align:right;font-weight:bold;font-size:14px">Итого: ${fmt(s.total)} сом</div>
      ${s.change > 0 ? `<div style="text-align:right;font-size:12px">Сдача: ${fmt(s.change)} сом</div>` : ""}
      <p style="text-align:center;font-size:12px;margin-top:8px">Спасибо за покупку!</p>
    </div>`;
    try { printJS({ printable: html, type: "raw-html" }); }
    catch { toast.error("Печать недоступна"); }
  };

  // Отправка чека по SMS — требует SMS-шлюз (заглушка)
  const sendReceipt = () => toast("Отправка чека по SMS — скоро (нужен SMS-шлюз)", { icon: "✉️" });

  // Новая продажа после подтверждения
  const continueSale = () => {
    setView("register");
    setLastSale(null);
    setSelectedClient(null);
    setNote("");
    setDueDate("");
    loadCarts();
  };

  const sellerInitial = (user?.name || "P")[0].toUpperCase();
  const sellerColor = AVATAR_COLORS[(user?.name?.length || 0) % AVATAR_COLORS.length];
  const hasDebtRow = payments.some((p) => p.method === "DEBT");

  return (
    <div className="-m-4 md:-m-8 h-[calc(100vh-57px)] flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* ===== ТЁМНЫЙ НАВБАР POS ===== */}
      <div className="flex items-center gap-2 px-3 h-14 bg-[#1b2330] border-b border-black/30 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setView("register")} className={"px-3.5 py-1.5 rounded-md text-sm font-semibold bg-[#2b3545] transition " + (view === "register" ? "text-white ring-2 ring-teal-500/80" : "text-slate-300 hover:text-white")}>
            Регистрация
          </button>
          <button onClick={() => setView("orders")} className={"px-3.5 py-1.5 rounded-md text-sm font-semibold bg-[#2b3545] transition " + (view === "orders" ? "text-white ring-2 ring-teal-500/80" : "text-slate-300 hover:text-white")}>
            Заказы
          </button>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button onClick={async () => { await newCart(); setSelectedItemId(null); }} title="Новый чек" className="w-9 h-9 flex items-center justify-center rounded-md text-slate-300 bg-[#2b3545] hover:text-white transition">
            <Plus size={18} />
          </button>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[34vw]">
            {carts.length === 0 ? (
              <span className="px-4 py-1.5 rounded-md text-sm font-semibold text-slate-400 bg-[#2b3545]">—</span>
            ) : carts.map((c) => (
              <button
                key={c.id}
                onClick={() => { switchCart(c.id); setSelectedItemId(null); }}
                title={(c.items?.length || 0) + " тов."}
                className={"px-4 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap shrink-0 transition bg-[#2b3545] " + (c.id === activeId ? "text-white ring-2 ring-teal-500/80" : "text-slate-300 hover:text-white")}
              >
                {c.number}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="relative hidden sm:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchEnter}
              placeholder="Поиск товаров..."
              className="w-56 lg:w-80 pl-9 pr-3 py-2 rounded-lg text-sm bg-white text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button onClick={() => setShowScanner(true)} title="Сканер штрихкода" className="w-9 h-9 flex items-center justify-center rounded-md text-slate-200 hover:bg-white/10 transition">
            <ScanLine size={20} />
          </button>
          <div className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: sellerColor }} title={user?.name}>
            {sellerInitial}
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="w-9 h-9 flex items-center justify-center rounded-md text-slate-200 hover:bg-white/10 transition">
              <Menu size={20} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-[#2b3545] rounded-lg shadow-2xl border border-white/10 py-1.5 z-50 text-sm text-slate-200">
                  <button onClick={() => { toggle(); setMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition">
                    {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Светлая тема" : "Тёмная тема"}
                  </button>
                  <button onClick={reloadData} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition">
                    <RefreshCw size={16} /> Обновить данные
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button onClick={() => { setMenuOpen(false); session ? setShowCashMove(true) : toast.error("Сначала откройте кассу"); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition">
                    <Wallet size={16} /> Поступления / выплаты
                  </button>
                  <button onClick={() => { setMenuOpen(false); session ? setShowClose(true) : toast.error("Касса не открыта"); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition text-rose-300">
                    <LogOut size={16} /> Закрыть кассу
                  </button>
                  <div className="h-px bg-white/10 my-1" />
                  <button onClick={() => { setMenuOpen(false); navigate("/"); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition">
                    <LayoutGrid size={16} /> Панель управления
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== РЕЖИМ: РЕГИСТРАЦИЯ ===== */}
      {view === "register" && (
        <div className="flex-1 flex min-h-0">
          {/* ЛЕВАЯ ПАНЕЛЬ: ЧЕК + КЛАВИАТУРА */}
          <div className="w-[38%] min-w-[360px] max-w-[460px] flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <div className="flex-1 overflow-y-auto min-h-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600 select-none">
                  <Package size={44} className="mb-2" />
                  <p className="text-sm">Выберите товар</p>
                </div>
              ) : (
                items.map((i) => {
                  const active = i.id === selectedItemId;
                  return (
                    <div
                      key={i.id}
                      onClick={() => selectLine(i.id)}
                      className={"group flex items-center gap-3 px-3 py-2.5 cursor-pointer border-l-4 transition " +
                        (active
                          ? "bg-teal-50 dark:bg-teal-500/10 border-teal-500"
                          : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/40 border-b border-b-slate-100 dark:border-b-slate-700/60")}
                    >
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 w-8 shrink-0 tabular-nums">{i.quantity}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{i.product?.name}</p>
                        <p className="text-xs text-slate-400">{fmt(i.price)} сом / {UNITS[i.product?.unit] || "шт"}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white whitespace-nowrap tabular-nums">{fmt(i.quantity * i.price)}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeItem(i.id); }} className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Налоги</span><span className="tabular-nums">0 сом</span>
              </div>
              <div className="flex justify-between items-baseline mt-0.5">
                <span className="font-bold text-slate-800 dark:text-white">Всего</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">{fmt(total)} сом</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 border-y border-slate-200 dark:border-slate-700 shrink-0">
              <button onClick={() => setShowClient(true)} className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition">
                <User size={16} className={selectedClient ? "text-teal-500" : "text-slate-500"} />
                <span className={"truncate " + (selectedClient ? "text-teal-600 dark:text-teal-400" : "text-slate-600 dark:text-slate-300")}>
                  {selectedClient ? selectedClient.name : "Клиент"}
                </span>
              </button>
              <button onClick={() => setShowNote(true)} className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 transition">
                <FileText size={16} className={note ? "text-teal-500" : "text-slate-500"} /> Заметка
              </button>
              <button onClick={async () => { await newCart(); setSelectedItemId(null); }} title="Отложить (новый чек)" className="flex items-center justify-center py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition">
                <Upload size={16} />
              </button>
              <button onClick={() => (items.length ? clearCart() : null)} title="Очистить чек" className="flex items-center justify-center py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 transition">
                <MoreVertical size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 shrink-0">
              <NumKey onClick={() => press("1")}>1</NumKey>
              <NumKey onClick={() => press("2")}>2</NumKey>
              <NumKey onClick={() => press("3")}>3</NumKey>
              <ModeKey active={mode === "QTY"} onClick={() => changeMode("QTY")} label="Кол-во" value={mode === "QTY" ? modeValue("QTY") : ""} />
              <NumKey onClick={() => press("4")}>4</NumKey>
              <NumKey onClick={() => press("5")}>5</NumKey>
              <NumKey onClick={() => press("6")}>6</NumKey>
              <ModeKey active={mode === "PERCENT"} onClick={() => changeMode("PERCENT")} label="%" value={mode === "PERCENT" ? modeValue("PERCENT") : ""} locked={!isAdmin && maxDisc <= 0} />
              <NumKey onClick={() => press("7")}>7</NumKey>
              <NumKey onClick={() => press("8")}>8</NumKey>
              <NumKey onClick={() => press("9")}>9</NumKey>
              <ModeKey active={mode === "PRICE"} onClick={() => changeMode("PRICE")} label="Цена" value={mode === "PRICE" ? modeValue("PRICE") : ""} locked={!canEditPrice} />
              <button onClick={() => press("pm")} className="h-14 flex items-center justify-center text-lg font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition">+/−</button>
              <NumKey onClick={() => press("0")}>0</NumKey>
              <button onClick={() => press(",")} className="h-14 flex items-center justify-center text-xl font-semibold bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/25 transition">,</button>
              <button onClick={() => press("back")} className="h-14 flex items-center justify-center bg-rose-200 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 hover:bg-rose-300 dark:hover:bg-rose-500/40 transition"><Delete size={22} /></button>
            </div>

            <button onClick={openPayment} className="shrink-0 w-full py-4 bg-[#714B67] hover:bg-[#5d3d54] active:bg-[#4f3347] text-white text-lg font-bold tracking-wide transition">
              Оплата
            </button>
          </div>

          {/* ПРАВАЯ ПАНЕЛЬ: КАТЕГОРИИ + ТОВАРЫ */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-900">
            <div className="flex gap-2 px-3 py-2.5 overflow-x-auto shrink-0">
              <CatTab active={!activeCat} color="#64748B" Icon={LayoutGrid} label="Все" onClick={() => setActiveCat(null)} />
              {categories.map((c) => (
                <CatTab key={c.id} active={activeCat === c.id} color={catColor(c.id)} Icon={catIcon(c.id)} label={c.name} onClick={() => setActiveCat(c.id)} />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
                  {Array.from({ length: 21 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600">
                  <Package size={44} className="mb-2" /><p>Товары не найдены</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
                  {filtered.map((p) => {
                    const inCart = qtyInCart(p.id);
                    const out = p.quantity <= 0;
                    const low = p.quantity > 0 && p.quantity <= (p.minStock || 0);
                    return (
                      <button key={p.id} onClick={() => handleAdd(p)} disabled={out} className="relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200/70 dark:border-slate-700 overflow-hidden text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-40 disabled:hover:translate-y-0 flex flex-col">
                        {inCart > 0 && <span className="absolute top-1.5 left-1.5 z-10 min-w-[22px] h-[22px] px-1 bg-slate-900 text-white text-xs rounded-md flex items-center justify-center font-bold shadow">{inCart}</span>}
                        <div className="aspect-square bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center overflow-hidden">
                          {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package size={26} className="text-slate-300 dark:text-slate-600" />}
                        </div>
                        <div className="px-2 py-1.5 flex-1 flex flex-col">
                          <p className="text-[11px] leading-tight font-medium text-slate-700 dark:text-slate-200 line-clamp-2 min-h-[28px]">{p.name}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">{fmt(p.sellPrice)}</p>
                          <p className={"text-[10px] mt-0.5 " + (out ? "text-red-500 font-semibold" : low ? "text-amber-500" : "text-slate-400")}>
                            {out ? "Нет в наличии" : "Остаток: " + p.quantity}
                          </p>
                        </div>
                        <div className="h-1 w-full" style={{ backgroundColor: catColor(p.categoryId) }} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== РЕЖИМ: ЗАКАЗЫ ===== */}
      {view === "orders" && <OrdersView user={user} />}

      {/* ===== РЕЖИМ: ОПЛАТА ===== */}
      {view === "payment" && (
        <div className="flex-1 flex min-h-0">
          {/* ЛЕВО: способы + клавиатура */}
          <div className="w-[38%] min-w-[360px] max-w-[460px] flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
            <div className="p-3 space-y-2 overflow-y-auto">
              {PAY_METHODS.map((m) => (
                <button key={m.value} onClick={() => addPayment(m.value)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/40 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-500/10 text-slate-700 dark:text-slate-200 font-medium transition">
                  <m.Icon size={20} className="text-slate-500 dark:text-slate-400" /> {m.label}
                </button>
              ))}
            </div>

            <div className="px-3 pb-2">
              <button onClick={() => setShowClient(true)} className={"w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition " + (selectedClient ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-slate-200 dark:border-slate-600 text-slate-500")}>
                <User size={16} /> {selectedClient ? selectedClient.name : "Клиент"}
              </button>
              {hasDebtRow && (
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full mt-2 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
              )}
            </div>

            <div className="mt-auto grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700 shrink-0">
              <NumKey onClick={() => pressPay("1")}>1</NumKey>
              <NumKey onClick={() => pressPay("2")}>2</NumKey>
              <NumKey onClick={() => pressPay("3")}>3</NumKey>
              <QuickKey onClick={() => addQuick(QUICK_SUMS[0])}>+{QUICK_SUMS[0]}</QuickKey>
              <NumKey onClick={() => pressPay("4")}>4</NumKey>
              <NumKey onClick={() => pressPay("5")}>5</NumKey>
              <NumKey onClick={() => pressPay("6")}>6</NumKey>
              <QuickKey onClick={() => addQuick(QUICK_SUMS[1])}>+{QUICK_SUMS[1]}</QuickKey>
              <NumKey onClick={() => pressPay("7")}>7</NumKey>
              <NumKey onClick={() => pressPay("8")}>8</NumKey>
              <NumKey onClick={() => pressPay("9")}>9</NumKey>
              <QuickKey onClick={() => addQuick(QUICK_SUMS[2])}>+{QUICK_SUMS[2]}</QuickKey>
              <NumKey onClick={() => pressPay("0")}>0</NumKey>
              <NumKey onClick={() => pressPay(",")}>,</NumKey>
              <button onClick={() => pressPay("back")} className="h-14 flex items-center justify-center bg-rose-200 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 hover:bg-rose-300 dark:hover:bg-rose-500/40 transition col-span-2"><Delete size={22} /></button>
            </div>

            <div className="grid grid-cols-2 gap-px bg-slate-200 dark:bg-slate-700 shrink-0">
              <button onClick={() => setView("register")} className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition">
                <ArrowLeft size={18} /> Назад
              </button>
              <button onClick={handleConfirm} disabled={saving || remaining > 0} className="py-4 bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition disabled:opacity-40">
                {saving ? "..." : "Подтвердить"}
              </button>
            </div>
          </div>

          {/* ПРАВО: сумма + список платежей */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-900 p-6">
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 uppercase tracking-wide">К оплате</p>
              <p className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tabular-nums mt-1">{fmt(total)} <span className="text-3xl text-slate-400">сом</span></p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 max-w-2xl w-full mx-auto">
              {payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-600">
                  <Wallet size={40} className="mb-2" /><p className="text-sm">Выберите способ оплаты слева</p>
                </div>
              ) : payments.map((p) => {
                const meta = PAY_METHODS.find((m) => m.value === p.method);
                const active = p.id === activePayId;
                return (
                  <div key={p.id} onClick={() => selectPayment(p.id)} className={"flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition " + (active ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800")}>
                    {meta && <meta.Icon size={20} className="text-slate-500 dark:text-slate-400" />}
                    <span className="font-medium text-slate-700 dark:text-slate-200">{meta?.label}</span>
                    <span className="ml-auto text-lg font-bold text-slate-900 dark:text-white tabular-nums">{fmt(p.amount)} сом</span>
                    <button onClick={(e) => { e.stopPropagation(); removePayment(p.id); }} className="p-1 text-rose-400 hover:text-rose-600 transition"><X size={18} /></button>
                  </div>
                );
              })}
            </div>

            <div className="max-w-2xl w-full mx-auto border-t border-slate-200 dark:border-slate-700 mt-2 pt-3">
              {remaining > 0 ? (
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-slate-500">Осталось</span>
                  <span className="text-2xl font-extrabold text-rose-500 tabular-nums">{fmt(remaining)} сом</span>
                </div>
              ) : change > 0 ? (
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-semibold text-slate-500">Сдача</span>
                  <span className="text-2xl font-extrabold text-emerald-500 tabular-nums">{fmt(change)} сом</span>
                </div>
              ) : (
                <div className="flex justify-end items-center gap-2 text-emerald-500 font-bold text-lg">
                  <Check size={22} /> Оплачено полностью
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== РЕЖИМ: ПОДТВЕРЖДЕНИЕ ОПЛАТЫ ===== */}
      {view === "receipt" && lastSale && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#121823] text-white p-6 min-h-0">
          <p className="text-2xl text-slate-300 font-light mb-6">Выплаченная сумма</p>
          <p className="text-6xl md:text-7xl font-extrabold tabular-nums">{fmt(lastSale.total)} <span className="text-4xl text-slate-500">сом</span></p>
          {lastSale.change > 0 && (
            <p className="mt-4 text-2xl text-emerald-400 font-semibold tabular-nums">Сдача: {fmt(lastSale.change)} сом</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            <button onClick={printReceipt} className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2b3545] hover:bg-[#36425a] text-white font-semibold transition"><Printer size={18} /> Печать</button>
            <button onClick={sendReceipt} className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#2b3545] hover:bg-[#36425a] text-white font-semibold transition"><Send size={18} /> Отправить чек</button>
            <button onClick={continueSale} className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#714B67] hover:bg-[#5d3d54] text-white font-bold transition"><Plus size={18} /> Продолжить</button>
          </div>
        </div>
      )}

      {/* ===== СКАНЕР ===== */}
      {showScanner && <BarcodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      {/* ===== ВЫБОР КЛИЕНТА ===== */}
      {showClient && (
        <ClientPicker
          clients={clients}
          selected={selectedClient}
          onSelect={(c) => { setSelectedClient(c); setShowClient(false); }}
          onClear={() => { setSelectedClient(null); setShowClient(false); }}
          onCreated={(c) => { setClients((prev) => [c, ...prev]); setSelectedClient(c); setShowClient(false); }}
          onClose={() => setShowClient(false)}
        />
      )}

      {/* ===== ЗАМЕТКА ===== */}
      {showNote && <NoteModal value={note} onSave={(v) => { setNote(v); setShowNote(false); }} onClose={() => setShowNote(false)} />}

      {/* ===== СМЕНА: открытие (обязательно) ===== */}
      {sessionLoaded && !session && (
        <OpenSessionModal onOpened={(s) => setSession(s)} onCancel={() => navigate("/")} />
      )}

      {/* ===== СМЕНА: закрытие ===== */}
      {showClose && session && (
        <CloseSessionModal session={session} onClose={() => setShowClose(false)} onClosed={() => { setShowClose(false); setSession(null); }} />
      )}

      {/* ===== СМЕНА: приход/расход ===== */}
      {showCashMove && session && (
        <CashMovementModal session={session} onClose={() => setShowCashMove(false)} />
      )}
    </div>
  );
}

/* ===== Кнопка-цифра ===== */
function NumKey({ children, onClick }) {
  return (
    <button onClick={onClick} className="h-14 flex items-center justify-center text-xl font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 transition">
      {children}
    </button>
  );
}

/* ===== Быстрая сумма (зелёная) ===== */
function QuickKey({ children, onClick }) {
  return (
    <button onClick={onClick} className="h-14 flex items-center justify-center text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition">
      {children}
    </button>
  );
}

/* ===== Кнопка-режим (Кол-во / % / Цена) ===== */
function ModeKey({ active, onClick, label, value, locked }) {
  return (
    <button onClick={onClick} className={"h-14 flex flex-col items-center justify-center text-sm font-semibold transition " + (locked ? "opacity-40 " : "") + (active ? "bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-300 ring-2 ring-inset ring-teal-500" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700")}>
      <span>{label}{locked ? " 🔒" : ""}</span>
      {active && value !== "" && <span className="text-xs font-bold tabular-nums opacity-80">{value}</span>}
    </button>
  );
}

/* ===== Вкладка категории ===== */
function CatTab({ active, color, Icon, label, onClick }) {
  const style = active ? { backgroundColor: color, color: "#fff" } : { backgroundColor: color + "22", color };
  return (
    <button onClick={onClick} style={style} className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 min-w-[110px] justify-center transition hover:brightness-95">
      <Icon size={18} /> {label}
    </button>
  );
}

/* ===== Модал: выбор/создание клиента ===== */
function ClientPicker({ clients, selected, onSelect, onClear, onCreated, onClose }) {
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const list = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone || "").includes(q));

  const create = async () => {
    if (!form.name || !form.phone) return toast.error("Имя и телефон обязательны");
    setSaving(true);
    try {
      const r = await api.post("/clients", form);
      toast.success("Клиент добавлен");
      onCreated(r.data.data);
    } catch { toast.error("Ошибка"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-slate-800 dark:text-white">{creating ? "Новый клиент" : "Выбор клиента"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        {creating ? (
          <div className="p-5 space-y-3">
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Имя клиента" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+996700000000" className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setCreating(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">Назад</button>
              <button onClick={create} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition disabled:opacity-50">{saving ? "..." : "Сохранить"}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск клиентов..." className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {selected && (
                <button onClick={onClear} className="w-full flex items-center gap-2 px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border-b border-slate-100 dark:border-slate-700 transition">
                  <X size={15} /> Убрать клиента ({selected.name})
                </button>
              )}
              {list.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">Клиенты не найдены</p>
              ) : list.map((c) => (
                <button key={c.id} onClick={() => onSelect(c)} className={"w-full flex items-center gap-2 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 border-b border-slate-50 dark:border-slate-700/50 transition " + (selected?.id === c.id ? "bg-teal-50 dark:bg-teal-500/10" : "")}>
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    {c.totalDue > 0 && <span className="text-xs font-semibold text-rose-500 whitespace-nowrap">Долг: {fmt(c.totalDue)} сом</span>}
                    {selected?.id === c.id && <Check size={18} className="text-teal-500" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition">
                <Plus size={16} /> Создать клиента
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ===== Модал: заметка к чеку ===== */
function NoteModal({ value, onSave, onClose }) {
  const [v, setV] = useState(value || "");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-white">Заметка к чеку</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <textarea autoFocus value={v} onChange={(e) => setV(e.target.value)} rows={4} placeholder="Добавьте заметку..." className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition">Отмена</button>
          <button onClick={() => onSave(v)} className="flex-1 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold transition">Сохранить</button>
        </div>
      </div>
    </div>
  );
}
