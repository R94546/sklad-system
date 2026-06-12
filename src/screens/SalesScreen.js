import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

const PAYMENT_TYPES = [
  { value: 'CASH', label: 'Naqd', icon: 'cash-outline', color: '#10b981' },
  { value: 'CARD', label: 'Karta', icon: 'card-outline', color: '#2563eb' },
  { value: 'DEBT', label: 'Nasiya', icon: 'time-outline', color: '#ef4444' },
];

export default function SalesScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [paymentType, setPaymentType] = useState('CASH');
  const [clientId, setClientId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState('0');
  const [saving, setSaving] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [clientModal, setClientModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  // Kassa: bitta umumiy, admin ochadi — sotuvchi ulanadi
  const [session, setSession] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [opening, setOpening] = useState(false);
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const checkSession = () => api.get('/sessions/current').then(r => setSession(r.data.data || null)).catch(() => {});

  useEffect(() => {
    api.get('/products?limit=1000').then(r => setProducts(r.data.data.data));
    api.get('/clients').then(r => setClients(r.data.data.data));
    checkSession();
  }, []);

  // Har safar ekranga qaytganda kassa holatini yangilash
  useEffect(() => navigation.addListener('focus', checkSession), [navigation]);

  const handleOpenKassa = async () => {
    setOpening(true);
    try {
      const r = await api.post('/sessions/open', { openingCash: Number(openingCash) || 0 });
      setSession(r.data.data);
      setOpenModal(false);
      setOpeningCash('');
      Alert.alert('Muvaffaqiyat', 'Kassa ochildi');
    } catch (err) { Alert.alert('Xato', err.response?.data?.message || 'Xatolik'); }
    setOpening(false);
  };

  // Skaner orqali tovar qo'shish
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const scannedProduct = navigation.getState()?.routes?.find(r => r.name === 'Sales')?.params?.scannedProduct;
      if (scannedProduct) {
        addProduct(scannedProduct);
        navigation.setParams({ scannedProduct: null });
      }
    });
    return unsubscribe;
  }, [navigation, items]);

  const addProduct = (product) => {
    if (product.quantity <= 0) return Alert.alert('Xato', 'Bu mahsulot tugagan');
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      setItems(prev => prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, { productId: product.id, name: product.name, price: Number(product.sellPrice), quantity: 1, max: product.quantity }]);
    }
    setProductModal(false);
    setProductSearch('');
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeItem(productId);
    const item = items.find(i => i.productId === productId);
    if (qty > item.max) return Alert.alert('Xato', 'Yetarli mahsulot yoq');
    setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeItem = (productId) => setItems(items.filter(i => i.productId !== productId));

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalTotal = total - Number(discount || 0);
  const selectedClient = clients.find(c => c.id === clientId);

  const handleSubmit = async () => {
    if (!session) return Alert.alert('Kassa yopiq', isAdmin ? 'Avval kassani oching' : 'Administrator kassani ochishi kerak');
    if (items.length === 0) return Alert.alert('Xato', 'Mahsulot qoshing');
    if (paymentType === 'DEBT' && !clientId) return Alert.alert('Xato', 'Mijoz tanlang');
    if (paymentType === 'DEBT' && !dueDate) return Alert.alert('Xato', 'Muddat kiriting');
    setSaving(true);
    try {
      await api.post('/sales', {
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        paymentType, clientId: clientId || undefined, dueDate: dueDate || undefined, discount: Number(discount || 0),
      });
      Alert.alert('Muvaffaqiyat', 'Sotuv amalga oshirildi!');
      setItems([]); setClientId(''); setDueDate(''); setDiscount('0'); setPaymentType('CASH');
    } catch (err) { Alert.alert('Xato', err.response?.data?.message || 'Xatolik'); }
    setSaving(false);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Text style={styles.title}>Yangi sotuv</Text>
        {items.length > 0 && <Text style={styles.itemCount}>{items.length} mahsulot</Text>}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!session && (
          <View style={styles.kassaBanner}>
            <Ionicons name="lock-closed" size={18} color="#d97706" />
            <Text style={styles.kassaBannerText}>
              {isAdmin ? 'Kassa yopiq — sotish uchun oching' : 'Kassa yopiq — administrator ochishi kerak'}
            </Text>
            {isAdmin ? (
              <TouchableOpacity style={styles.kassaOpenBtn} onPress={() => setOpenModal(true)}>
                <Text style={styles.kassaOpenText}>Ochish</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.kassaOpenBtn} onPress={checkSession}>
                <Ionicons name="refresh" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tolov turi</Text>
          <View style={styles.paymentRow}>
            {PAYMENT_TYPES.map(p => (
              <TouchableOpacity key={p.value} onPress={() => setPaymentType(p.value)}
                style={[styles.paymentBtn, paymentType === p.value && { backgroundColor: p.color, borderColor: p.color }]}>
                <Ionicons name={p.icon} size={18} color={paymentType === p.value ? '#fff' : '#6b7280'} />
                <Text style={[styles.paymentLabel, paymentType === p.value && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mijoz</Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setClientModal(true)}>
            <Ionicons name="person-outline" size={18} color="#6b7280" />
            <Text style={[styles.selectText, selectedClient && { color: '#111827' }]}>
              {selectedClient ? selectedClient.name + ' · ' + selectedClient.phone : 'Mijoz tanlang'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {paymentType === 'DEBT' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nasiya muddati</Text>
            <TextInput style={styles.input} placeholder="2026-06-30" placeholderTextColor="#9ca3af" value={dueDate} onChangeText={setDueDate} />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mahsulotlar</Text>
            <View style={styles.addBtns}>
              <TouchableOpacity style={styles.scanIconBtn} onPress={() => navigation.navigate('Scanner', {
                mode: 'cart',
                onScan: (product) => addProduct(product)
              })}>
                <Ionicons name="barcode-outline" size={18} color="#2563eb" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={() => setProductModal(true)}>
                <Ionicons name="add" size={18} color="#2563eb" />
                <Text style={styles.addText}>Qoshish</Text>
              </TouchableOpacity>
            </View>
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyProducts}>
              <TouchableOpacity onPress={() => navigation.navigate('Scanner', { mode: 'cart', onScan: (product) => addProduct(product) })} style={styles.emptyAction}>
                <Ionicons name="barcode-outline" size={28} color="#2563eb" />
                <Text style={styles.emptyActionText}>Barcode skaner</Text>
              </TouchableOpacity>
              <View style={styles.emptyDivider} />
              <TouchableOpacity onPress={() => setProductModal(true)} style={styles.emptyAction}>
                <Ionicons name="search-outline" size={28} color="#6b7280" />
                <Text style={[styles.emptyActionText, { color: '#6b7280' }]}>Qidirish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map(item => (
              <View key={item.productId} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>{item.price.toLocaleString()} so'm</Text>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.productId, item.quantity - 1)}>
                    <Ionicons name="remove" size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.productId, item.quantity + 1)}>
                    <Ionicons name="add" size={16} color="#6b7280" />
                  </TouchableOpacity>
                  <Text style={styles.itemTotal}>{(item.price * item.quantity).toLocaleString()}</Text>
                  <TouchableOpacity onPress={() => removeItem(item.productId)}>
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skidka (so'm)</Text>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
        </View>

        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Jami summa</Text>
            <Text style={styles.totalValue}>{total.toLocaleString()} so'm</Text>
          </View>
          {Number(discount) > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Skidka</Text>
              <Text style={[styles.totalValue, { color: '#ef4444' }]}>-{Number(discount).toLocaleString()} so'm</Text>
            </View>
          )}
          <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#e5e7eb', marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.totalLabel, { fontWeight: '700', color: '#111827' }]}>Tolov summasi</Text>
            <Text style={[styles.totalValue, { color: '#2563eb', fontSize: 18 }]}>{finalTotal.toLocaleString()} so'm</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleSubmit} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>Sotish</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={productModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mahsulot tanlang</Text>
            <TouchableOpacity onPress={() => { setProductModal(false); setProductSearch(''); }}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput style={styles.modalSearchInput} placeholder="Qidirish..." placeholderTextColor="#9ca3af" value={productSearch} onChangeText={setProductSearch} autoFocus />
          </View>
          <FlatList data={filteredProducts} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => addProduct(item)}>
                <View>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemSub}>Qoldiq: {item.quantity} · {Number(item.sellPrice).toLocaleString()} so'm</Text>
                </View>
                <Ionicons name="add-circle" size={24} color="#2563eb" />
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={openModal} animationType="fade" transparent>
        <View style={styles.kassaOverlay}>
          <View style={styles.kassaModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kassani ochish</Text>
              <TouchableOpacity onPress={() => setOpenModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Boshlang'ich naqd pul</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor="#9ca3af" value={openingCash} onChangeText={setOpeningCash} keyboardType="numeric" autoFocus />
            <TouchableOpacity style={[styles.submitBtn, { marginTop: 16 }, opening && { opacity: 0.7 }]} onPress={handleOpenKassa} disabled={opening}>
              {opening ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="lock-open-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>Ochish</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={clientModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mijoz tanlang</Text>
            <TouchableOpacity onPress={() => { setClientModal(false); setClientSearch(''); }}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalSearch}>
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput style={styles.modalSearchInput} placeholder="Qidirish..." placeholderTextColor="#9ca3af" value={clientSearch} onChangeText={setClientSearch} autoFocus />
          </View>
          <FlatList data={filteredClients} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => { setClientId(item.id); setClientModal(false); setClientSearch(''); }}>
                <View>
                  <Text style={styles.modalItemName}>{item.name}</Text>
                  <Text style={styles.modalItemSub}>{item.phone}</Text>
                </View>
                {clientId === item.id && <Ionicons name="checkmark-circle" size={24} color="#10b981" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  itemCount: { backgroundColor: '#eff6ff', color: '#2563eb', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, fontSize: 12, fontWeight: '600' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  paymentRow: { flexDirection: 'row', gap: 10 },
  paymentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  paymentLabel: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  selectBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  selectText: { flex: 1, fontSize: 14, color: '#9ca3af' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb' },
  addBtns: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scanIconBtn: { width: 34, height: 34, backgroundColor: '#eff6ff', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  emptyProducts: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden' },
  emptyAction: { flex: 1, alignItems: 'center', padding: 24, gap: 8 },
  emptyActionText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  emptyDivider: { width: 1, backgroundColor: '#e5e7eb' },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  itemInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemPrice: { fontSize: 13, color: '#6b7280' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 24, textAlign: 'center' },
  itemTotal: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2563eb', textAlign: 'right' },
  totalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLabel: { fontSize: 14, color: '#6b7280' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSearch: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  modalSearchInput: { flex: 1, fontSize: 14, color: '#111827' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1 },
  modalItemName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  modalItemSub: { fontSize: 12, color: '#9ca3af' },
  kassaBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a' },
  kassaBannerText: { flex: 1, fontSize: 13, color: '#d97706', fontWeight: '500' },
  kassaOpenBtn: { backgroundColor: '#d97706', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  kassaOpenText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  kassaOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  kassaModalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
});
