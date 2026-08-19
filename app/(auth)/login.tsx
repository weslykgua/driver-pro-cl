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
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
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

        if (data?.session) {
          router.replace('/(tabs)');
        } else if (data?.user) {
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
      const redirectUrl = Platform.OS === 'web' ? window.location.origin : 'triprate://';
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isDesktop && styles.cardDesktop
        ]}>
          {/* Corporate Brand Header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoBadge, { backgroundColor: colors.neutralSoft, borderColor: colors.border }]}>
              <Ionicons name="bar-chart" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.appName, { color: colors.text }]}>TripRate</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Control financiero para conductores</Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {isSignUp ? 'Crear Cuenta de Usuario' : 'Acceso por Cuenta'}
          </Text>
          <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
            Es necesario contar con una cuenta activa para guardar y consultar sus registros
          </Text>

          {/* Google OAuth Button */}
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
            onPress={handleGoogleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-google" size={18} color={colors.text} style={{ marginRight: 8 }} />
            <Text style={[styles.googleButtonText, { color: colors.text }]}>Continuar con Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>O INGRESA CON EMAIL</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email / Password Form */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Correo Electrónico</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="conductor@empresa.cl"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contraseña</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleEmailAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>
                {isSignUp ? 'Registrar Cuenta' : 'Iniciar Sesión'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Sign In / Register */}
          <TouchableOpacity style={styles.toggleButton} onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={[styles.toggleText, { color: colors.primary }]}>
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Registra tu correo'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    borderRadius: RADIUS.md,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  appTagline: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  googleButton: {
    flexDirection: 'row',
    height: 46,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  googleButtonText: {
    fontSize: 14,
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
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 10,
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
  },
  primaryButton: {
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
