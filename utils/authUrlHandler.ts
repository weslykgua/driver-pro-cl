import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

/**
 * Parses authentication tokens or PKCE codes from Supabase OAuth redirect URLs
 * (both hash fragment #access_token=... and query param ?code=...).
 */
export const handleAuthUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;

  try {
    // 1. Check query parameters (?code=... or ?access_token=...)
    const parsed = Linking.parse(url);
    const params = parsed.queryParams || {};

    if (params.code && typeof params.code === 'string') {
      const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (!error && data.session) {
        return true;
      }
    }

    // 2. Check hash fragment (#access_token=...&refresh_token=...)
    let accessToken = typeof params.access_token === 'string' ? params.access_token : '';
    let refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : '';

    if (!accessToken && url.includes('#')) {
      const hash = url.split('#')[1];
      const searchParams = new URLSearchParams(hash);
      accessToken = searchParams.get('access_token') || '';
      refreshToken = searchParams.get('refresh_token') || '';
    }

    if (accessToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (!error && data.session) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Error extracting OAuth tokens from redirect URL:', err);
  }
  return false;
};

