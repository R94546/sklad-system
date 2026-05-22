import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Debts from './pages/Debts';
import Sales from './pages/Sales';
import SaleDetail from './pages/SaleDetail';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Categories from './pages/Categories';
import StockIn from './pages/StockIn';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user?.role === 'ADMIN' ? <PrivateRoute>{children}</PrivateRoute> : <Navigate to="/" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
        <Route path="/sales/:id" element={<PrivateRoute><SaleDetail /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/clients/:id" element={<PrivateRoute><ClientDetail /></PrivateRoute>} />
        <Route path="/debts" element={<PrivateRoute><Debts /></PrivateRoute>} />
        <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/categories" element={<AdminRoute><Categories /></AdminRoute>} />
        <Route path="/stockin" element={<AdminRoute><StockIn /></AdminRoute>} />
        <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="/audit" element={<AdminRoute><AuditLog /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
