import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TokenStorage = {
  get: (): Promise<string | null> => SecureStore.getItemAsync('jwt'),
  set: (token: string): Promise<void> => SecureStore.setItemAsync('jwt', token),
  clear: (): Promise<void> => SecureStore.deleteItemAsync('jwt'),
};

export const CacheStorage = {
  get: async <T>(key: string): Promise<T | null> => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set: async (key: string, value: unknown): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Non-critical — cache write failure is silently ignored
    }
  },
  remove: (key: string): Promise<void> => AsyncStorage.removeItem(key),
};

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface TimestampedCache<T> {
  data: T;
  timestamp: number;
}

export const TimedCache = {
  get: async <T>(key: string): Promise<T | null> => {
    const entry = await CacheStorage.get<TimestampedCache<T>>(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
    return entry.data;
  },
  set: (key: string, data: unknown): Promise<void> =>
    CacheStorage.set(key, { data, timestamp: Date.now() }),
};
