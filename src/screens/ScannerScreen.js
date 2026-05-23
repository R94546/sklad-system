import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../api/axios';

export default function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await api.get('/products?search=' + data);
      const products = res.data.data.data;
      if (products.length === 0) {
        Alert.alert('Topilmadi', 'Barcode: ' + data, [
          { text: 'Qayta', onPress: () => setScanned(false) },
          { text: 'Ortga', onPress: () => navigation.goBack() },
        ]);
      } else {
        const p = products[0];
        Alert.alert(p.name, 'Narx: ' + Number(p.sellPrice).toLocaleString() + " so'm\nQoldiq: " + p.quantity, [
          { text: 'Qayta', onPress: () => setScanned(false) },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert('Xato', 'Xatolik yuz berdi', [{ text: 'OK', onPress: () => setScanned(false) }]);
    }
    setLoading(false);
  };

  if (!permission) return <View style={styles.center}><Text>Yuklanmoqda...</Text></View>;

  if (!permission.granted) return (
    <View style={styles.center}>
      <Ionicons name="camera-off-outline" size={48} color="#9ca3af" />
      <Text style={styles.text}>Kameraga ruxsat kerak</Text>
      <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
        <Text style={styles.permBtnText}>Ruxsat berish</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView style={StyleSheet.absoluteFillObject} onBarcodeScanned={scanned ? undefined : handleBarCodeScanned} barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'] }} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Barcode skaner</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.overlay}>
        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.hint}>Barcodni to'rtburchak ichiga oling</Text>
      </View>

      {scanned && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.rescanText}>Qayta skanerlash</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#f9fafb' },
  text: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  permBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  permBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scanArea: { width: 250, height: 250, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#2563eb', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 20 },
  footer: { padding: 20 },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2563eb', borderRadius: 12, padding: 14 },
  rescanText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});