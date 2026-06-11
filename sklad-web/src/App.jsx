import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products'));
const Clients = lazy(() => import('./pages/Clients'));
const ClientDetail = lazy(() => import('./pages/ClientDetail'));
const Debts = lazy(() => import('./pages/Debts'));
const SaleDetail = lazy(() => import('./pages/SaleDetail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Users = lazy(() => import('./pages/Users'));
const Categories = lazy(() => import('./pages/Categories'));
const StockIn = lazy(() => import('./pages/StockIn'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const POS = lazy(() => import('./pages/POS'));
const Sessions = lazy(() => import('./pages/Sessions'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
    <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
  </div>
);

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
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: "#1E293B", color: "#F1F5F9", borderRadius: "10px", border: "1px solid #334155", fontSize: "14px", fontFamily: "Inter, system-ui, sans-serif", padding: "12px 16px", boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }, success: { iconTheme: { primary: "#10B981", secondary: "#F1F5F9" }, style: { background: "#1E293B", color: "#F1F5F9", border: "1px solid #10B981" } }, error: { iconTheme: { primary: "#EF4444", secondary: "#F1F5F9" }, style: { background: "#1E293B", color: "#F1F5F9", border: "1px solid #EF4444" } } }} />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
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
          <Route path="/sessions" element={<AdminRoute><Sessions /></AdminRoute>} />
          <Route path="/pos" element={<PrivateRoute><POS /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
