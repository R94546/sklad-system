import { create } from "zustand";
import { persist } from "zustand/middleware";

const useThemeStore = create(persist(
  (set) => ({
    dark: false,
    toggle: () => set(s => {
      const next = !s.dark;
      document.documentElement.classList.toggle("dark", next);
      return { dark: next };
    }),
    init: () => {
      const saved = JSON.parse(localStorage.getItem("theme-store") || "{}");
      if (saved?.state?.dark) document.documentElement.classList.add("dark");
    }
  }),
  { name: "theme-store" }
));

export default useThemeStore;
