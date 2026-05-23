import { create } from "zustand";
import api from "../api/axios";

const useCartStore = create((set, get) => ({
  cart: null,
  loading: false,

  fetchCart: async () => {
    try {
      const r = await api.get("/sales/cart/my");
      set({ cart: r.data.data });
    } catch {
      set({ cart: null });
    }
  },

  addToCart: async (productId, quantity = 1, price) => {
    try {
      const r = await api.post("/sales/cart/add", { productId, quantity, price });
      set({ cart: r.data.data });
      return true;
    } catch {
      return false;
    }
  },

  removeItem: async (itemId) => {
    try {
      const r = await api.delete("/sales/cart/item/" + itemId);
      set({ cart: r.data.data });
    } catch {}
  },

  confirmCart: async (data) => {
    const cart = get().cart;
    if (!cart) return false;
    try {
      await api.post("/sales/cart/" + cart.id + "/confirm", data);
      set({ cart: null });
      return true;
    } catch {
      return false;
    }
  },

  clearCart: () => set({ cart: null }),
}));

export default useCartStore;
