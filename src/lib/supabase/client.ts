import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

class MemoryStorage {
  private store: Record<string, string> = {};
  async getItem(key: string): Promise<string | null> {
    return this.store[key] || null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }
  async removeItem(key: string): Promise<void> {
    delete this.store[key];
  }
}

const memoryStorage = new MemoryStorage();
const useSecureStore = Platform.OS !== 'web' && process.env.NODE_ENV !== 'test';

// SecureStore custom adapter for Supabase session persistence with memory fallback
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (!useSecureStore) return memoryStorage.getItem(key);
    try {
      const available = await SecureStore.isAvailableAsync();
      if (!available) return memoryStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return memoryStorage.getItem(key);
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!useSecureStore) return memoryStorage.setItem(key, value);
    try {
      const available = await SecureStore.isAvailableAsync();
      if (!available) return memoryStorage.setItem(key, value);
      await SecureStore.setItemAsync(key, value);
    } catch (e) {
      memoryStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (!useSecureStore) return memoryStorage.removeItem(key);
    try {
      const available = await SecureStore.isAvailableAsync();
      if (!available) return memoryStorage.removeItem(key);
      await SecureStore.deleteItemAsync(key);
    } catch (e) {
      memoryStorage.removeItem(key);
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing! Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY are set in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
