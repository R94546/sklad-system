import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [modal, setModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return Alert.alert('Xato', 'Barcha maydonlarni toldiring');
    if (newPassword.length < 6) return Alert.alert('Xato', 'Parol kamida 6 ta belgidan iborat bolsin');
    setSaving(true);
    try {
      await api.put('/users/' + user.id, { password: newPassword });
      Alert.alert('Muvaffaqiyat', 'Parol yangilandi!');
      setModal(false);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      Alert.alert('Xato', err.response?.data?.message || 'Xatolik');
    }
    setSaving(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0] || 'A'}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role === 'ADMIN' ? 'Admin' : 'Sotuvchi'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setModal(true)}>
            <View style={styles.menuIcon}>
              <Ionicons name="lock-closed-outline" size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>Parolni ozgartirish</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
            <View style={[styles.menuIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Tizimdan chiqish</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Sklad v1.0.0</Text>
      </ScrollView>

      {modal && (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Parolni ozgartirish</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Eski parol" placeholderTextColor="#9ca3af" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
            <TextInput style={styles.input} placeholder="Yangi parol" placeholderTextColor="#9ca3af" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  scroll: { paddingBottom: 40 },
  profileCard: { alignItems: 'center', padding: 24, marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 20, elevation: 2, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#2563eb' },
  name: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  phone: { fontSize: 14, color: '#6b7280', marginBottom: 10 },
  roleBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  section: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 20, marginBottom: 12, elevation: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
  version: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 20 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  input: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  saveBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
