import React, { createContext, useContext, useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';
import { ThemeProvider, useTheme, LIGHT_FINTECH_COLORS } from '../constants/theme';
import { CookieConsentBanner } from '../components/CookieConsentBanner';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

function MainApp() {
  const router = useRouter();
  const { colors } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching profile:', error.message);
      }

      if (data) {
        setProfile(data as Profile);
      } else {
        const defaultProf: Profile = {
          id: userId,
          email: session?.user?.email || '',
          sii_tax_rate: 0.1525,
          default_gas_price: 1450,
          monthly_pocket_target: 1300000,
          default_consumption: 7.4,
        };
        await supabase.from('profiles').upsert(defaultProf);
        setProfile(defaultProf);
      }
    } catch (e) {
      console.warn('Profile fetch exception:', e);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Session change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }
    } catch (e) {
      console.warn('SignOut exception:', e);
    } finally {
      setSession(null);
      setProfile(null);
      setLoading(false);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = window.location.origin + '/(auth)/login';
      } else {
        router.replace('/(auth)/login');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        refreshProfile,
        signOut,
      }}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {Platform.OS === 'web' && (
          <style dangerouslySetInnerHTML={{
            __html: `
              html, body, #root, [data-expo-root] {
                height: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: ${colors.background} !important;
                display: flex !important;
                flex-direction: column !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
                scroll-behavior: smooth !important;
                -webkit-overflow-scrolling: touch !important;
              }

              /* Custom Sleek Scrollbar */
              ::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              ::-webkit-scrollbar-track {
                background: ${colors.background};
              }
              ::-webkit-scrollbar-thumb {
                background: ${colors.border};
                border-radius: 999px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: ${colors.textMuted};
              }

              * {
                box-sizing: border-box;
              }
            `
          }} />
        )}
        <StatusBar style={colors.isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background, flex: 1 },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>

        <CookieConsentBanner />
      </View>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
