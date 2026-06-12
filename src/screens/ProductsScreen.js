import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, ActivityIndicator, RefreshControl, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { setCache, getCache } from '../utils/cache';

const UNITS = { PIECE: 'dona', KG: 'kg', METER: 'metr', LITER: 'litr', BOX: 'quti' };

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState('list'); // list | grid
  const insets = useSafeAreaInsets();

  useEffect(() => { AsyncStorage.getItem('view:products').then(v => v && setView(v)); }, []);
  const toggleView = () => {
    const v = view === 'list' ? 'grid' : 'list';
    setView(v);
    AsyncStorage.setItem('view:products', v);
  };

  const load = async () => {
    if (!search) {
      const cached = await getCache('products');
      if (cached) { setProducts(cached); setLoading(false); }
    }
    try {
      const res = await api.get('/products?search=' + search);
      setProducts(res.data.data.data);
      if (!search) setCache('products', res.data.data.data);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [search]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Text style={styles.title}>Mahsulotlar</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.scanBtn} onPress={toggleView}>
            <Ionicons name={view === 'list' ? 'grid-outline' : 'list-outline'} size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('Scanner')}>
            <Ionicons name="barcode-outline" size={22} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput
          style={styles.searchInput}
          placeholder="Qidirish..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={18} color="#9ca3af" /></TouchableOpacity> : null}
      </View>

      <FlatList
        data={products}
        key={view}
        numColumns={view === 'grid' ? 2 : 1}
        columnWrapperStyle={view === 'grid' ? { gap: 10 } : undefined}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Mahsulotlar topilmadi</Text>
          </View>
        }
        renderItem={({ item }) => view === 'grid' ? (
          <View style={styles.gridCard}>
            <View style={styles.iconBox}>
              <Ionicons name="cube-outline" size={20} color="#2563eb" />
            </View>
            <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.category}>{item.category?.name}</Text>
            <Text style={[styles.price, { marginTop: 6 }]}>{Number(item.sellPrice).toLocaleString()} so'm</Text>
            <View style={[styles.badge, { marginTop: 6, backgroundColor: item.quantity <= item.minStock ? '#fef2f2' : '#ecfdf5' }]}>
              <Text style={[styles.badgeText, { color: item.quantity <= item.minStock ? '#ef4444' : '#10b981' }]}>
                {item.quantity} {UNITS[item.unit]}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="cube-outline" size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.category}>{item.category?.name}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.price}>{Number(item.sellPrice).toLocaleString()} so'm</Text>
              <View style={[styles.badge, { backgroundColor: item.quantity <= item.minStock ? '#fef2f2' : '#ecfdf5' }]}>
                <Text style={[styles.badgeText, { color: item.quantity <= item.minStock ? '#ef4444' : '#10b981' }]}>
                  {item.quantity} {UNITS[item.unit]}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  count: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 20, marginBottom: 12, gap: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: { width: 40, height: 40, backgroundColor: '#eff6ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  category: { fontSize: 12, color: '#9ca3af' },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  price: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  scanBtn: { width: 40, height: 40, backgroundColor: '#eff6ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  gridCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, alignItems: 'flex-start' },
});
