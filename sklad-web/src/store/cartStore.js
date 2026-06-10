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

  // Совместимость: одиночная корзина (используется на странице «Корзина»)
  fetchCart: async () => {
    try {
      const r = await api.get("/sales/cart/my");
      const c = r.data.data;
      if (c) set((s) => ({ cart: c, activeId: c.id, carts: upsert(s.carts, c) }));
      else set({ cart: null });
    } catch {
      set({ cart: null });
    }
  },

  addToCart: async (productId, quantity = 1, price) => {
    try {
      const saleId = get().activeId || undefined;
      const r = await api.post("/sales/cart/add", { productId, quantity, price, saleId });
      const c = r.data.data;
      set((s) => ({ carts: upsert(s.carts, c), activeId: c.id, cart: { ...s.cart, ...c } }));
      return true;
    } catch {
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
