import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

declare const process: {
  env: {
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const formatValidSupabaseUrl = (urlInput: string): string => {
  if (!urlInput || typeof urlInput !== 'string') {
    return 'https://demo-supabase-url.supabase.co';
  }
  const trimmed = urlInput.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (/^[a-z0-9]+$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }
  return 'https://demo-supabase-url.supabase.co';
};

const supabaseUrl = formatValidSupabaseUrl(rawUrl);
const supabaseAnonKey = rawKey && rawKey.trim().length > 10 ? rawKey.trim() : 'demo-anon-key-placeholder';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
