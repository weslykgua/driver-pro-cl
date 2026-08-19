import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor ingresa tu email y contraseña');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (data?.user) {
          Alert.alert(
            'Cuenta Creada Exitosamente',
            'Tu cuenta ha sido creada. Puedes iniciar sesión ahora.',
            [{ text: 'Aceptar', onPress: () => setIsSignUp(false) }]
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        if (data?.session) {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      Alert.alert('Error de Autenticación', error.message || 'No se pudo completar la operación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const redirectUrl = Platform.OS === 'web' ? window.location.origin : 'conductor-pro://';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Google OAuth', error.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[styles.cardContainer, isDesktop && styles.cardDesktop]}>
          {/* Corporate Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Conductor Pro</Text>
            <Text style={styles.appTagline}>Gestión Financiera & Control Operativo por Cuenta</Text>
          </View>

          {/* Subtitle */}
          <Text style={styles.formTitle}>
            {isSignUp ? 'Registro de Cuenta Individual' : 'Acceso Institucional por Usuario'}
          </Text>
          <Text style={styles.formSubtitle}>
            Sus datos financieros se almacenan de forma privada e aislada por cuenta
          </Text>

          {/* Form Inputs */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="conductor@empresa.cl"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Primary Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={18} color={COLORS.text} style={{ marginRight: 8 }} />
            <Text style={styles.googleButtonText}>Acceder con Google</Text>
          </TouchableOpacity>

          {/* Toggle Login / SignUp */}
          <TouchableOpacity style={styles.toggleButton} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.toggleText}>
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Registrate aquí'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>MODO EVALUACIÓN</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Quick Demo Mode */}
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoMode} activeOpacity={0.8}>
            <Ionicons name="cube-outline" size={16} color={COLORS.secondary} style={{ marginRight: 6 }} />
            <Text style={styles.demoButtonText}>Acceso Directo (Modo Demo)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardDesktop: {
    maxWidth: 480,
    padding: 36,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  demoButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.neutralSoft,
    height: 42,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  demoButtonText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
