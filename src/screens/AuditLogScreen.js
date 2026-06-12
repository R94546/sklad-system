import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';

// Harakat kodlari — tushunarli nomlar
const ACTIONS = {
  LOGIN: { label: 'Tizimga kirish', color: '#8b5cf6' },
  PRODUCT_CREATE: { label: 'Mahsulot yaratildi', color: '#10b981' },
  PRODUCT_UPDATE: { label: 'Mahsulot ozgartirildi', color: '#2563eb' },
  PRODUCT_DELETE: { label: 'Mahsulot ochirildi', color: '#ef4444' },
  INVENTORY_ADJUST: { label: 'Inventarizatsiya', color: '#d97706' },
  STOCK_IN: { label: 'Kirim (prixod)', color: '#10b981' },
  STOCK_EDIT: { label: 'Kirim ozgartirildi', color: '#2563eb' },
  STOCK_DELETE: { label: 'Kirim ochirildi', color: '#ef4444' },
  CATEGORY_CREATE: { label: 'Kategoriya yaratildi', color: '#10b981' },
  CATEGORY_UPDATE: { label: 'Kategoriya ozgartirildi', color: '#2563eb' },
  CATEGORY_DELETE: { label: 'Kategoriya ochirildi', color: '#ef4444' },
  CLIENT_CREATE: { label: 'Mijoz yaratildi', color: '#10b981' },
  CLIENT_UPDATE: { label: 'Mijoz ozgartirildi', color: '#2563eb' },
  CLIENT_BLOCK: { label: 'Mijoz bloklandi', color: '#ef4444' },
  CLIENT_UNBLOCK: { label: 'Mijoz blokdan chiqarildi', color: '#10b981' },
  USER_CREATE: { label: 'Foydalanuvchi yaratildi', color: '#10b981' },
  USER_UPDATE: { label: 'Foydalanuvchi ozgartirildi', color: '#2563eb' },
  USER_DELETE: { label: 'Foydalanuvchi ochirildi', color: '#ef4444' },
  DEBT_PAY: { label: 'Qarz tolovi', color: '#10b981' },
  SALE_CONFIRM: { label: 'Sotuv', color: '#10b981' },
  SALE_CANCEL: { label: 'Sotuv bekor qilindi', color: '#ef4444' },
  SALE_RETURN: { label: 'Qaytarish', color: '#d97706' },
  SALE_DELETE: { label: 'Chek ochirildi', color: '#ef4444' },
  OPEN_SESSION: { label: 'Kassa ochildi', color: '#10b981' },
  CLOSE_SESSION: { label: 'Kassa yopildi', color: '#6b7280' },
  SESSION_REOPEN: { label: 'Kassa qayta ochildi', color: '#d97706' },
  CASH_IN: { label: 'Naqd kirim', color: '#10b981' },
  CASH_OUT: { label: 'Naqd chiqim', color: '#d97706' },
};

const FIELDS = {
  name: 'Nomi', phone: 'Telefon', address: 'Manzil', note: 'Izoh', role: 'Rol',
  isActive: 'Faol', maxDiscountPercent: 'Maks. skidka %', canEditPrice: 'Narx ozgartirish',
  imageUrl: 'Rasm', passwordChanged: 'Parol', barcode: 'Shtrix-kod', category: 'Kategoriya',
  buyPrice: 'Kirim narxi', sellPrice: 'Sotish narxi', quantity: 'Qoldiq', minStock: 'Min. qoldiq',
  unit: 'Birlik', amount: 'Summa', paid: 'Tolangan', method: 'Usul', diff: 'Farq',
  number: 'Chek №', total: 'Summa', paymentType: 'Tolov', price: 'Narx',
  openingCash: 'Ochilishdagi naqd', closingCash: 'Yopilishdagi naqd', expectedCash: 'Kutilgan',
  difference: 'Farq', reason: 'Sabab', type: 'Turi', status: 'Holat', productId: 'Mahsulot',
};

const VALUES = {
  CASH: 'Naqd', CARD: 'Karta', DEBT: 'Nasiya', MIXED: 'Aralash',
  ADMIN: 'Admin', SELLER: 'Sotuvchi', PIECE: 'dona', KG: 'kg', METER: 'm', LITER: 'l', BOX: 'quti',
  IN: 'Kirim', OUT: 'Chiqim', OPEN: 'Ochiq', CLOSED: 'Yopiq',
  PENDING: 'Kutilmoqda', PAID: 'Tolangan', OVERDUE: 'Muddati otgan', COMPLETED: 'Yakunlangan',
};

const SKIP = new Set(['id', 'sellerId', 'sessionId', 'userId', 'debtId', 'createdAt', 'closedAt', 'openedAt', 'movements', 'salesTotal', 'sales']);

const ENTITY_FILTERS = [
  { value: '', label: 'Hammasi' },
  { value: 'Sale', label: 'Sotuvlar' },
  { value: 'Product', label: 'Mahsulotlar' },
  { value: 'Debt', label: 'Qarzlar' },
  { value: 'CashSession', label: 'Kassa' },
  { value: 'Client', label: 'Mijozlar' },
  { value: 'StockIn', label: 'Kirim' },
  { value: 'User', label: 'Foydalanuvchilar' },
  { value: 'Category', label: 'Kategoriyalar' },
];

const fmtVal = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Ha' : 'Yoq';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'string' && VALUES[v]) return VALUES[v];
  if (typeof v === 'string' && /^https?:\/\//.test(v)) return 'havola';
  if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') return Number(v).toLocaleString();
  return String(v);
};

function describe(log) {
  const o = log.oldData, n = log.newData;
  const parts = [];

  if (log.action === 'INVENTORY_ADJUST' && o && n) {
    const d = Number(n.diff) || 0;
    return `Qoldiq: ${fmtVal(o.quantity)} → ${fmtVal(n.quantity)} (${d > 0 ? '+' : ''}${d.toLocaleString()})`;
  }
  if (log.action === 'DEBT_PAY' && n) return `${fmtVal(n.amount)} so'm qabul qilindi · ${fmtVal(n.method || 'CASH')}`;
  if (log.action === 'SALE_CONFIRM' && n) return `Chek №${n.number ?? '—'} · ${fmtVal(n.total)} so'm · ${fmtVal(n.paymentType)}`;
  if (log.action === 'STOCK_IN' && n) return `+${fmtVal(n.quantity)} dona, ${fmtVal(n.price)} so'mdan`;
  if ((log.action === 'CASH_IN' || log.action === 'CASH_OUT') && n) return `${fmtVal(n.amount)} so'm${n.reason ? ' · ' + n.reason : ''}`;
  if (log.action === 'OPEN_SESSION' && n) return `Ochilishdagi naqd: ${fmtVal(n.openingCash)} so'm`;
  if (log.action === 'CLOSE_SESSION' && n) {
    const d = Number(n.difference) || 0;
    return `Fakt ${fmtVal(n.closingCash)} · kutilgan ${fmtVal(n.expectedCash)} · farq ${d > 0 ? '+' : ''}${d.toLocaleString()}`;
  }

  if (o && n && typeof o === 'object' && typeof n === 'object') {
    for (const k of Object.keys(n)) {
      if (SKIP.has(k)) continue;
      if (k === 'passwordChanged') { parts.push('Parol ozgartirildi'); continue; }
      if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) parts.push(`${FIELDS[k] || k}: ${fmtVal(o[k])} → ${fmtVal(n[k])}`);
    }
    return parts.length ? parts.join('; ') : 'Ozgarishsiz';
  }
  if (n && typeof n === 'object') {
    for (const k of Object.keys(n)) {
      if (SKIP.has(k)) continue;
      if (n[k] === null || n[k] === undefined || n[k] === '' || n[k] === 0 || n[k] === false) continue;
      parts.push(`${FIELDS[k] || k}: ${fmtVal(n[k])}`);
    }
    return parts.slice(0, 4).join('; ');
  }
  if (o && typeof o === 'object' && o.name) return `Edi: «${o.name}»`;
  return '';
}

const LIMIT = 30;

export default function AuditLogScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [entity, setEntity] = useState('');
  const insets = useSafeAreaInsets();

  const load = useCallback(async (p = 1, ent = entity) => {
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (ent) params.set('entity', ent);
      const res = await api.get('/audit?' + params.toString());
      const { data, total: t } = res.data.data;
      setLogs(prev => p === 1 ? data : [...prev, ...data]);
      setTotal(t);
      setPage(p);
    } catch {}
  }, [entity]);

  useEffect(() => {
    setLoading(true);
    load(1).finally(() => setLoading(false));
  }, [entity]);

  const onRefresh = async () => { setRefreshing(true); await load(1); setRefreshing(false); };
  const loadMore = async () => {
    if (loadingMore || logs.length >= total) return;
    setLoadingMore(true);
    await load(page + 1);
    setLoadingMore(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Jurnal</Text>
        <Text style={styles.count}>{total} ta</Text>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {ENTITY_FILTERS.map(f => (
            <TouchableOpacity key={f.value} onPress={() => setEntity(f.value)}
              style={[styles.chip, entity === f.value && styles.chipActive]}>
              <Text style={[styles.chipText, entity === f.value && styles.chipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color="#2563eb" style={{ marginVertical: 12 }} /> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Yozuvlar topilmadi</Text>
            </View>
          }
          renderItem={({ item }) => {
            const a = ACTIONS[item.action] || { label: item.action, color: '#6b7280' };
            const details = describe(item);
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  {item.user?.imageUrl ? (
                    <Image source={{ uri: item.user.imageUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{item.user?.name?.[0] || '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.user?.name || '—'}</Text>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  <View style={[styles.actionBadge, { backgroundColor: a.color + '18' }]}>
                    <Text style={[styles.actionText, { color: a.color }]}>{a.label}</Text>
                  </View>
                </View>
                {details ? <Text style={styles.details}>{details}</Text> : null}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#111827' },
  count: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  chips: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 36, height: 36, borderRadius: 18 },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#2563eb' },
  userName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dateText: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  actionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, maxWidth: 150 },
  actionText: { fontSize: 11, fontWeight: '600' },
  details: { fontSize: 13, color: '#4b5563', marginTop: 10, lineHeight: 18, backgroundColor: '#f9fafb', borderRadius: 10, padding: 10 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
});
