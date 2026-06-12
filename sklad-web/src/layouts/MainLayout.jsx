import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import useAuthStore from "../store/authStore";
import useThemeStore from "../store/themeStore";
import toast from "react-hot-toast";
import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList, ClipboardCheck, Moon, Sun, Wallet, ArrowLeft } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Панель" },
  { path: "/products", icon: Package, label: "Товары" },
  { path: "/stockin", icon: PackagePlus, label: "Приём", adminOnly: true },
  { path: "/inventory", icon: ClipboardCheck, label: "Инвентаризация", adminOnly: true },
  { path: "/pos", icon: ShoppingCart, label: "Продажа (POS)" },
  { path: "/clients", icon: Users, label: "Клиенты" },
  { path: "/debts", icon: CreditCard, label: "Долги" },
  { path: "/sessions", icon: Wallet, label: "Смены", adminOnly: true },
  { path: "/analytics", icon: BarChart2, label: "Аналитика", adminOnly: true },
  { path: "/categories", icon: Tag, label: "Категории", adminOnly: true },
  { path: "/users", icon: UserCog, label: "Пользователи", adminOnly: true },
  { path: "/audit", icon: ClipboardList, label: "Журнал", adminOnly: true },
  { path: "/settings", icon: Settings, label: "Настройки", adminOnly: true },
];

export default function MainLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { dark, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success("Вы вышли");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 flex flex-col transform transition-transform duration-200 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
            <Package size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Sklad</h1>
            <p className="text-xs text-slate-400">{user?.role === "ADMIN" ? "Администратор" : "Продавец"}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.filter(item => !item.adminOnly || user?.role === "ADMIN").map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-indigo-500/10 text-indigo-400" : "text-slate-400 hover:text-white hover:bg-slate-800/50"}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {label}
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.phone}</p>
            </div>
            <button onClick={toggle} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 w-full transition-all">
            <LogOut size={18} />
            Выход
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800" title="Меню">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          {location.pathname !== "/" && (
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-slate-600 dark:text-slate-300" title="Назад">
              <ArrowLeft size={20} />
              <span className="text-sm font-medium hidden sm:inline">Назад</span>
            </button>
          )}
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Sklad</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}





