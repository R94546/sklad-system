import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl, ActivityIndicator, TouchableOpacity, StatusBar, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';

const STATUS = { PENDING: { label: 'Kutilmoqda', color: '#d97706', bg: '#fffbeb' }, PAID: { label: 'Tolangan', color: '#10b981', bg: '#ecfdf5' }, OVERDUE: { label: 'Muddati otgan', color: '#ef4444', bg: '#fef2f2' } };

export default function DebtsScreen() {
  const [debts, setDebts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');
  const [paying, setPaying] = useState(false);
  const insets = useSafeAreaInsets();

  const load = async () => {
    try {
      const res = await api.get('/debts');
      setDebts(res.data.data.data);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const openPay = (debt) => { setSelected(debt); setAmount(''); setMethod('CASH'); setPayModal(true); };

  const handlePay = async () => {
    if (!amount || Number(amount) <= 0) return Alert.alert('Xato', 'Summa kiriting');
    setPaying(true);
    try {
      await api.patch('/debts/' + selected.id + '/pay', { amount: Number(amount), method });
      Alert.alert('Muvaffaqiyat', 'Tolov qabul qilindi!');
      setPayModal(false);
      load();
    } catch (err) {
      Alert.alert('Xato', err.response?.data?.message || 'Xatolik');
    }
    setPaying(false);
  };

  const filtered = debts.filter(d =>
    d.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.client?.phone?.includes(search)
  );

  const totalDebt = filtered.filter(d => d.status !== 'PAID').reduce((sum, d) => sum + (Number(d.amount) - Number(d.paid)), 0);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Text style={styles.title}>Nasiyalar</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{totalDebt.toLocaleString()} so'm</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Mijoz ismi yoki telefon..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9ca3af" /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Nasiyalar topilmadi</Text>
          </View>
        }
        renderItem={({ item }) => {
          const remaining = Number(item.amount) - Number(item.paid);
          const status = STATUS[item.status];
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.clientInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.client?.name?.[0] || '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.clientName}>{item.client?.name}</Text>
                    <Text style={styles.clientPhone}>{item.client?.phone}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Jami</Text>
                  <Text style={styles.amountValue}>{Number(item.amount).toLocaleString()} so'm</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tolangan</Text>
                  <Text style={[styles.amountValue, { color: '#10b981' }]}>{Number(item.paid).toLocaleString()} so'm</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Qoldiq</Text>
                  <Text style={[styles.amountValue, { color: '#ef4444', fontWeight: '700' }]}>{remaining.toLocaleString()} so'm</Text>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
                    <Text style={styles.dateText}>{new Date(item.dueDate).toLocaleDateString()}</Text>
                  </View>
                  {item.status !== 'PAID' && (
                    <TouchableOpacity style={styles.payBtn} onPress={() => openPay(item)}>
                      <Ionicons name="cash-outline" size={16} color="#fff" />
                      <Text style={styles.payBtnText}>Tolov</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <Modal visible={payModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tolov qabul qilish</Text>
            <TouchableOpacity onPress={() => setPayModal(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          {selected && (
            <View style={styles.modalContent}>
              <View style={styles.clientCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selected.client?.name?.[0]}</Text>
                </View>
                <View>
                  <Text style={styles.clientName}>{selected.client?.name}</Text>
                  <Text style={styles.clientPhone}>{selected.client?.phone}</Text>
                </View>
              </View>
              <View style={styles.debtInfo}>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Jami qarz</Text>
                  <Text style={styles.amountValue}>{Number(selected.amount).toLocaleString()} so'm</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Tolangan</Text>
                  <Text style={[styles.amountValue, { color: '#10b981' }]}>{Number(selected.paid).toLocaleString()} so'm</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={[styles.amountLabel, { fontWeight: '700' }]}>Qoldiq</Text>
                  <Text style={[styles.amountValue, { color: '#ef4444', fontWeight: '700', fontSize: 16 }]}>
                    {(Number(selected.amount) - Number(selected.paid)).toLocaleString()} so'm
                  </Text>
                </View>
              </View>
              <Text style={styles.inputLabel}>Tolov usuli</Text>
              <View style={styles.methodRow}>
                {[{ k: 'CASH', label: 'Naqd', icon: 'cash-outline', color: '#10b981' }, { k: 'CARD', label: 'Karta', icon: 'card-outline', color: '#2563eb' }].map(m => (
                  <TouchableOpacity key={m.k} onPress={() => setMethod(m.k)}
                    style={[styles.methodBtn, method === m.k && { backgroundColor: m.color, borderColor: m.color }]}>
                    <Ionicons name={m.icon} size={18} color={method === m.k ? '#fff' : '#6b7280'} />
                    <Text style={[styles.methodLabel, method === m.k && { color: '#fff' }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Tolov summasi</Text>
              <TextInput
                style={styles.payInput}
                placeholder="Summani kiriting"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity style={[styles.submitPayBtn, paying && { opacity: 0.7 }]} onPress={handlePay} disabled={paying}>
                {paying ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.submitPayText}>Tasdiqlash</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  totalBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  totalText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 20, marginBottom: 12, gap: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  clientInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#2563eb' },
  clientName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  clientPhone: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBottom: { padding: 14 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  amountLabel: { fontSize: 13, color: '#6b7280' },
  amountValue: { fontSize: 13, fontWeight: '600', color: '#111827' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: '#f3f4f6' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: '#9ca3af' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  payBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { padding: 20 },
  clientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  debtInfo: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, elevation: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  methodLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  payInput: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 18, color: '#111827', borderWidth: 1.5, borderColor: '#2563eb', marginBottom: 16 },
  submitPayBtn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4 },
  submitPayText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
