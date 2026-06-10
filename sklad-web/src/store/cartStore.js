import { create } from "zustand";
import api from "../api/axios";

// Вставить/обновить корзину в массиве по id (с сохранением ранее загруженных полей)
const upsert = (carts, c) => {
  const i = carts.findIndex((x) => x.id === c.id);
  if (i === -1) return [...carts, c];
  const next = carts.slice();
  next[i] = { ...next[i], ...c };
  return next;
};

const useCartStore = create((set, get) => ({
  cart: null,        // активная корзина
  carts: [],         // все открытые чеки продавца (параллельные)
  activeId: null,    // id активной корзины
  loading: false,

  // Загрузить все открытые чеки и выбрать активный
  loadCarts: async () => {
    try {
      const r = await api.get("/sales/cart/all");
      const carts = r.data.data || [];
      const cur = get().activeId;
      const active = carts.find((c) => c.id === cur) || carts[0] || null;
      set({ carts, activeId: active?.id || null, cart: active });
      return carts;
    } catch {
      set({ carts: [], activeId: null, cart: null });
      return [];
    }
  },

  // Новый пустой чек → стать активным
  newCart: async () => {
    try {
      const r = await api.post("/sales/cart/new");
      const c = r.data.data;
      set((s) => ({ carts: upsert(s.carts, c), activeId: c.id, cart: c }));
      return c;
    } catch {
      return null;
    }
  },

  // Переключить активный чек
  switchCart: (id) => {
    const c = get().carts.find((x) => x.id === id) || null;
    set({ activeId: id, cart: c });
  },

  // product — объект товара (для мгновенной отрисовки в чеке до ответа сервера)
  addToCart: async (productId, quantity = 1, price, product) => {
    const saleId = get().activeId || undefined;
    const unitPrice = price != null ? price : product?.sellPrice;

    // ---- Оптимистичное обновление: товар сразу виден в чеке ----
    if (product) {
      set((s) => {
        let cart = s.cart
          ? { ...s.cart, items: (s.cart.items || []).slice() }
          : { id: "tmp-cart-" + Date.now(), status: "PENDING", items: [], totalAmount: 0 };
        const items = cart.items;
        const idx = items.findIndex((it) => it.productId === productId);
        if (idx === -1) {
          items.push({ id: "tmp-item-" + productId + "-" + Date.now(), productId, quantity, price: unitPrice, product });
        } else {
          items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
        }
        cart.totalAmount = items.reduce((sum, it) => sum + Number(it.price) * it.quantity, 0);
        return { cart, carts: upsert(s.carts, cart), activeId: cart.id };
      });
    }

    // ---- Реальный запрос + сверка с авторитетным ответом сервера ----
    try {
      const r = await api.post("/sales/cart/add", { productId, quantity, price, saleId });
      const c = r.data.data;
      set((s) => {
        const cleaned = s.carts.filter((x) => !String(x.id).startsWith("tmp-"));
        return { carts: upsert(cleaned, c), activeId: c.id, cart: { ...s.cart, ...c } };
      });
      return true;
    } catch {
      // откат оптимистичного состояния к серверному
      await get().loadCarts();
      return false;
    }
  },

  removeItem: async (itemId) => {
    try {
      const r = await api.delete("/sales/cart/item/" + itemId);
      const c = r.data.data;
      set((s) => ({ carts: upsert(s.carts, c), cart: s.activeId === c.id ? { ...s.cart, ...c } : s.cart }));
    } catch { /* игнорируем */ }
  },

  updateItem: async (itemId, quantity) => {
    try {
      const r = await api.patch("/sales/cart/item/" + itemId, { quantity });
      const c = r.data.data;
      set((s) => ({ carts: upsert(s.carts, c), cart: s.activeId === c.id ? { ...s.cart, ...c } : s.cart }));
    } catch { /* игнорируем */ }
  },

  // Обновление позиции корзины: количество и/или цена (для цифровой клавиатуры POS)
  patchItem: async (itemId, data) => {
    try {
      const r = await api.patch("/sales/cart/item/" + itemId, data);
      const c = r.data.data;
      set((s) => ({ carts: upsert(s.carts, c), cart: s.activeId === c.id ? { ...s.cart, ...c } : s.cart }));
      return true;
    } catch {
      return false;
    }
  },

  confirmCart: async (data) => {
    const { cart, activeId, carts } = get();
    const id = activeId || cart?.id;
    if (!id) return false;
    try {
      await api.post("/sales/cart/" + id + "/confirm", data);
      const rest = carts.filter((c) => c.id !== id);
      const next = rest[0] || null;
      set({ carts: rest, activeId: next?.id || null, cart: next });
      return true;
    } catch {
      return false;
    }
  },

  clearCart: () => set({ cart: null, carts: [], activeId: null }),
}));

export default useCartStore;
