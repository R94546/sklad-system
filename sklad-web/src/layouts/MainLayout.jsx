import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { LayoutDashboard, Package, PackagePlus, ShoppingCart, Users, CreditCard, BarChart2, LogOut, Menu, X, UserCog, Tag, Settings, ClipboardList } from 'lucide-react';


const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/products', icon: Package, label: 'Mahsulotlar' },
  { path: '/stockin', icon: PackagePlus, label: 'Kirim', adminOnly: true },
  { path: '/sales', icon: ShoppingCart, label: 'Sotuvlar' },
  { path: '/clients', icon: Users, label: 'Mijozlar' },
  { path: '/debts', icon: CreditCard, label: 'Nasiyalar' },
  { path: '/analytics', icon: BarChart2, label: 'Analitika', adminOnly: true },
  { path: '/categories', icon: Tag, label: 'Kategoriyalar', adminOnly: true },
  { path: '/users', icon: UserCog, label: 'Foydalanuvchilar', adminOnly: true },
  { path: '/audit', icon: ClipboardList, label: 'Audit log', adminOnly: true },
  { path: '/settings', icon: Settings, label: 'Sozlamalar', adminOnly: true },
];

export default function MainLayout({ children }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Chiqildi');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform ' + (open ? 'translate-x-0' : '-translate-x-full') + ' md:relative md:translate-x-0'}>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">Sklad</h1>
          <p className="text-sm text-gray-500">{user?.name}</p>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN').map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' + (location.pathname === path ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100')}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full">
            <LogOut size={18} />
            Chiqish
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 md:hidden">
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1 className="text-lg font-bold text-blue-600">Sklad</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
