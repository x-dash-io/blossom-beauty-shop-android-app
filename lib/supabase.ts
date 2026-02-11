import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.log('[Supabase] Error getting item:', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.log('[Supabase] Error setting item:', key, error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.log('[Supabase] Error removing item:', key, error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

function extractParamsFromUrl(url: string): { access_token?: string; refresh_token?: string } {
  const params: Record<string, string> = {};
  const hashPart = url.split('#')[1];
  if (hashPart) {
    hashPart.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) params[key] = decodeURIComponent(value);
    });
  }
  const queryPart = url.split('?')[1]?.split('#')[0];
  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) params[key] = decodeURIComponent(value);
    });
  }
  return params;
}

export function setupDeepLinkListener() {
  const handleUrl = async (event: { url: string }) => {
    const { access_token, refresh_token } = extractParamsFromUrl(event.url);
    if (access_token && refresh_token) {
      console.log('[Supabase] Setting session from deep link');
      await supabase.auth.setSession({ access_token, refresh_token });
    }
  };

  Linking.getInitialURL().then(url => {
    if (url) handleUrl({ url });
  });

  const subscription = Linking.addEventListener('url', handleUrl);
  return () => subscription.remove();
}
