import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Power, LogOut, Building2, Users, Package, ShoppingCart } from 'lucide-react';
import { Button, Input, Modal, Badge } from '../components/ui';
import { listOrganizations, createOrganization, setOrganizationActive } from '../api/admin';
import useAuthStore from '../store/authStore';

const VIOLET = '#714B67';

function StatChip({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <Icon size={13} />
      <span className="font-medium text-slate-700">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function OrgCard({ org, onToggle, toggling }) {
  const admin = org.users?.[0];
  const isActive = org.isActive;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col"
      style={{ borderTop: `3px solid ${VIOLET}` }}
    >
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
              style={{ background: VIOLET }}
            >
              {org.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 truncate">{org.name}</p>
              <p className="text-xs text-slate-400 truncate">{admin?.phone ?? '—'}</p>
            </div>
          </div>
          <Badge variant={isActive ? 'green' : 'red'}>
            {isActive ? 'Faol' : 'Bloklangan'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-t border-slate-100">
          <StatChip icon={Users} label="foydalanuvchi" value={org._count?.users ?? 0} />
          <StatChip icon={Package} label="mahsulot" value={org._count?.products ?? 0} />
          <StatChip icon={ShoppingCart} label="sotuv" value={org._count?.sales ?? 0} />
        </div>

        {admin && (
          <p className="text-xs text-slate-400 mt-1">
            Admin: <span className="text-slate-600 font-medium">{admin.name}</span>
          </p>
        )}
      </div>

      <div className="px-5 pb-4">
        <Button
          variant={isActive ? 'danger' : 'secondary'}
          size="sm"
          className="w-full gap-1.5"
          loading={toggling}
          onClick={() => onToggle(org)}
        >
          <Power size={13} />
          {isActive ? 'Bloklash' : 'Faollashtirish'}
        </Button>
      </div>
    </div>
  );
}

function CreateOrgModal({ open, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    adminName: '',
    adminPhone: '',
    adminPassword: '',
  });

  const mutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast.success("Sklad muvaffaqiyatli yaratildi");
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      onClose();
      setForm({ name: '', adminName: '', adminPhone: '', adminPassword: '' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Modal open={open} onClose={onClose} title="Yangi sklad qo'shish">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Sklad nomi"
          value={form.name}
          onChange={set('name')}
          placeholder="Masalan: Toshkent filiali"
          required
        />
        <Input
          label="Admin ismi"
          value={form.adminName}
          onChange={set('adminName')}
          placeholder="To'liq ism"
          required
        />
        <Input
          label="Admin telefoni"
          value={form.adminPhone}
          onChange={set('adminPhone')}
          placeholder="+998901234567"
          required
        />
        <Input
          label="Parol"
          type="password"
          value={form.adminPassword}
          onChange={set('adminPassword')}
          placeholder="Kamida 6 ta belgi"
          required
        />
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Bekor qilish
          </Button>
          <Button
            type="submit"
            className="flex-1"
            style={{ background: VIOLET }}
            loading={mutation.isPending}
          >
            Yaratish
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: listOrganizations,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => setOrganizationActive(id, isActive),
    onSuccess: (_data, { isActive }) => {
      toast.success(isActive ? 'Faollashtirildi' : 'Bloklandi');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => {
      toast.error('Xatolik yuz berdi');
    },
    onSettled: () => setTogglingId(null),
  });

  const handleToggle = (org) => {
    setTogglingId(org.id);
    toggleMutation.mutate({ id: org.id, isActive: !org.isActive });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header
        className="text-white px-6 py-4 flex items-center justify-between shadow-md"
        style={{ background: VIOLET }}
      >
        <div className="flex items-center gap-3">
          <Building2 size={22} />
          <div>
            <h1 className="font-bold text-lg leading-tight">Sklad — Super Admin</h1>
            <p className="text-xs opacity-75">Barcha skladlarni boshqarish</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90 hidden sm:block">{user?.name ?? user?.phone}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg"
          >
            <LogOut size={15} />
            Chiqish
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Skladlar</h2>
            <p className="text-sm text-slate-500">{orgs.length} ta sklad ro'yxatda</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2"
            style={{ background: VIOLET }}
          >
            <Plus size={16} />
            Yangi sklad
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div
              className="animate-spin h-10 w-10 border-4 border-t-transparent rounded-full"
              style={{ borderColor: `${VIOLET} transparent ${VIOLET} ${VIOLET}` }}
            />
          </div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Building2 size={48} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Hech qanday sklad yo'q</p>
            <p className="text-sm mt-1">Birinchi skladni yarating</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orgs.map((org) => (
              <OrgCard
                key={org.id}
                org={org}
                onToggle={handleToggle}
                toggling={togglingId === org.id && toggleMutation.isPending}
              />
            ))}
          </div>
        )}
      </main>

      <CreateOrgModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
