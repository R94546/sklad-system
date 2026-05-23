import AsyncStorage from '@react-native-async-storage/async-storage';

export const setCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
};

export const getCache = async (key, maxAge = 5 * 60 * 1000) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > maxAge) return null;
    return data;
  } catch { return null; }
};

export const clearCache = async (key) => {
  try { await AsyncStorage.removeItem(key); } catch {}
};
