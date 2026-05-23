import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, RefreshControl, ActivityIndicator, TouchableOpacity, StatusBar, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';

export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const insets = useSafeAreaInsets();

  const load = async () => {
    try {
      const res = await api.get('/clients?search=' + search);
      setClients(res.data.data.data);
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  useEffect(() => { load(); }, [search]);

  const handleCreate = async () => {
    if (!form.name || !form.phone) return Alert.alert('Xato', 'Ism va telefon kiriting');
    setSaving(true);
    try {
      await api.post('/clients', form);
      Alert.alert('Muvaffaqiyat', 'Mijoz qoshildi!');
      setModal(false);
      setForm({ name: '', phone: '', address: '' });
      load();
    } catch (err) {
      Alert.alert('Xato', err.response?.data?.message || 'Xatolik');
    }
    setSaving(false);
  };

  const filtered = clients;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Text style={styles.title}>Mijozlar</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Ism yoki telefon..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
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
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Mijozlar topilmadi</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModal(true)}>
              <Text style={styles.emptyBtnText}>Mijoz qoshish</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name?.[0] || '?'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              {item.address ? <Text style={styles.address}>{item.address}</Text> : null}
            </View>
            <View style={styles.right}>
              {item.isBlocked ? (
                <View style={styles.blockedBadge}>
                  <Text style={styles.blockedText}>Bloklangan</Text>
                </View>
              ) : (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeText}>Faol</Text>
                </View>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yangi mijoz</Text>
            <TouchableOpacity onPress={() => setModal(false)}>
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Ism familiya *</Text>
            <TextInput style={styles.input} placeholder="Ism familiya" placeholderTextColor="#9ca3af" value={form.name} onChangeText={v => setForm({...form, name: v})} />
            <Text style={styles.inputLabel}>Telefon *</Text>
            <TextInput style={styles.input} placeholder="+998901234567" placeholderTextColor="#9ca3af" value={form.phone} onChangeText={v => setForm({...form, phone: v})} keyboardType="phone-pad" />
            <Text style={styles.inputLabel}>Manzil</Text>
            <TextInput style={styles.input} placeholder="Manzil" placeholderTextColor="#9ca3af" value={form.address} onChangeText={v => setForm({...form, address: v})} />
            <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.7 }]} onPress={handleCreate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitText}>Saqlash</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  addBtn: { width: 40, height: 40, backgroundColor: '#2563eb', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 20, marginBottom: 12, gap: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563eb' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
  phone: { fontSize: 13, color: '#6b7280' },
  address: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  activeBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  activeText: { fontSize: 11, fontWeight: '600', color: '#10b981' },
  blockedBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  blockedText: { fontSize: 11, fontWeight: '600', color: '#ef4444' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  emptyBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: '#f9fafb' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 0.5, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { padding: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, elevation: 4 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
