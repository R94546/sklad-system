import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { setCache, getCache } from '../utils/cache';

const StatCard = ({ label, value, icon, color, bg }) => (
  <View style={[styles.card, { flex: 1 }]}>
    <View style={[styles.cardIcon, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={styles.cardLabel}>{label}</Text>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();

  const load = async () => {
    const cached = await getCache('dashboard');
    if (cached) setData(cached);
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
      setCache('dashboard', res.data.data);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {user?.name}!</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}>
        <View style={styles.row}>
          <StatCard label="Bugungi sotuv" value={Number(data?.today?.amount || 0).toLocaleString() + " so'm"} icon="cart" color="#2563eb" bg="#eff6ff" />
          <View style={{ width: 12 }} />
          <StatCard label="Oylik sotuv" value={Number(data?.month?.amount || 0).toLocaleString() + " so'm"} icon="trending-up" color="#10b981" bg="#ecfdf5" />
        </View>

        <View style={[styles.row, { marginTop: 12 }]}>
          <StatCard label="Umumiy qarz" value={Number(data?.totalDebt || 0).toLocaleString() + " so'm"} icon="card" color="#ef4444" bg="#fef2f2" />
          <View style={{ width: 12 }} />
          <StatCard label="Mijozlar" value={String(data?.totalClients || 0)} icon="people" color="#8b5cf6" bg="#f5f3ff" />
        </View>

        {data?.lowStockCount > 0 && (
          <View style={styles.alert}>
            <Ionicons name="warning" size={18} color="#d97706" />
            <Text style={styles.alertText}>{data.lowStockCount} ta mahsulot kam qoldi!</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bugungi sotuvlar</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sotuvlar soni</Text>
            <Text style={styles.infoValue}>{data?.today?.count || 0} ta</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Oylik sotuvlar</Text>
            <Text style={styles.infoValue}>{data?.month?.count || 0} ta</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#111827' },
  date: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 10 },
  row: { flexDirection: 'row', paddingHorizontal: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginBottom: 4 },
  cardValue: { fontSize: 16, fontWeight: '700' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginHorizontal: 20, marginTop: 12, borderWidth: 1, borderColor: '#fde68a' },
  alertText: { fontSize: 14, color: '#d97706', fontWeight: '500' },
  section: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, marginHorizontal: 20, marginTop: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
});
