import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const Products = () => <div className="text-2xl font-bold">Mahsulotlar</div>;
const Sales = () => <div className="text-2xl font-bold">Sotuvlar</div>;
const Clients = () => <div className="text-2xl font-bold">Mijozlar</div>;
const Debts = () => <div className="text-2xl font-bold">Nasiyalar</div>;
const Analytics = () => <div className="text-2xl font-bold">Analitika</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
        <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
        <Route path="/clients" element={<PrivateRoute><Clients /></PrivateRoute>} />
        <Route path="/debts" element={<PrivateRoute><Debts /></PrivateRoute>} />
        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
