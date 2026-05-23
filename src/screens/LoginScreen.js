import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';
import useAuthStore from '../store/authStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!phone || !password) return Alert.alert('Xato', 'Telefon va parol kiriting');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { phone, password });
      login(res.data.data);
    } catch (err) {
      Alert.alert('Xato', err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.logoBox}>
          <View style={styles.logo}>
            <Ionicons name="cube" size={36} color="#2563eb" />
          </View>
          <Text style={styles.appName}>Sklad</Text>
          <Text style={styles.subtitle}>Boshqaruv tizimi</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputBox}>
            <Ionicons name="call-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="+998901234567"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Parol"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirish</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { flex: 1, paddingHorizontal: 24 },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logo: { width: 80, height: 80, backgroundColor: '#eff6ff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4, shadowColor: '#2563eb', shadowOpacity: 0.2, shadowRadius: 12 },
  appName: { fontSize: 32, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#9ca3af', marginTop: 4 },
  form: { gap: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  inputIcon: { paddingLeft: 16 },
  input: { flex: 1, paddingVertical: 16, paddingHorizontal: 12, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 16 },
  button: { backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8, elevation: 4, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
