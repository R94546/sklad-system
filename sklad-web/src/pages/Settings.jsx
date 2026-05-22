import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Button, Input } from '../components/ui';

export default function Settings() {
  const [form, setForm] = useState({
    companyName: '', companyPhone: '', companyAddress: '',
    currency: 'UZS', taxPercent: 0, smsTemplate: '', reminderDays: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      const s = r.data.data;
      setForm({
        companyName: s.companyName || '',
        companyPhone: s.companyPhone || '',
        companyAddress: s.companyAddress || '',
        currency: s.currency || 'UZS',
        taxPercent: s.taxPercent || 0,
        smsTemplate: s.smsTemplate || '',
        reminderDays: s.reminderDays || 1,
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      toast.success('Sozlamalar saqlandi');
    } catch { toast.error('Xatolik'); }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Sozlamalar</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">Kompaniya ma'lumotlari</h2>
          <Input label="Kompaniya nomi" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} />
          <Input label="Telefon" value={form.companyPhone} onChange={e => setForm({...form, companyPhone: e.target.value})} />
          <Input label="Manzil" value={form.companyAddress} onChange={e => setForm({...form, companyAddress: e.target.value})} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">Moliyaviy sozlamalar</h2>
          <Input label="Valyuta" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} />
          <Input label="Soliq foizi (%)" type="number" value={form.taxPercent} onChange={e => setForm({...form, taxPercent: e.target.value})} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-700 border-b pb-2">SMS sozlamalari</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">SMS shabloni</label>
            <textarea
              value={form.smsTemplate}
              onChange={e => setForm({...form, smsTemplate: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400">Mavjud o'zgaruvchilar: {'{name}'}, {'{amount}'}, {'{date}'}</p>
          </div>
          <Input label="Eslatma necha kun oldin (kun)" type="number" value={form.reminderDays} onChange={e => setForm({...form, reminderDays: e.target.value})} />
        </div>

        <Button type="submit" className="w-full" size="lg" loading={saving}>Saqlash</Button>
      </form>
    </div>
  );
}