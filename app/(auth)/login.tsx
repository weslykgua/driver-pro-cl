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
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../../lib/supabase';
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';
import { handleAuthUrl } from '../../utils/authUrlHandler';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Password security validation standards
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const isPasswordValid = hasMinLength && hasUpper && hasNumber;

  const handleEmailAuth = async () => {
    if (!email || !password) {
      const msg = 'Por favor ingresa tu email y contraseña.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Atención', msg);
      return;
    }

    if (isSignUp) {
      if (!isPasswordValid) {
        const msg = 'La contraseña no cumple con los estándares mínimos de seguridad (8+ caracteres, 1 mayúscula y 1 número).';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Estándares de Contraseña', msg);
        return;
      }

      if (!isPasswordMatch) {
        const msg = 'Las contraseñas ingresadas no coinciden. Por favor verifique ambas entradas.';
        if (Platform.OS === 'web') window.alert(msg);
        else Alert.alert('Verificación de Contraseña', msg);
        return;
      }
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
          const successMsg = 'Tu cuenta ha sido creada exitosamente. Puedes iniciar sesión ahora.';
          if (Platform.OS === 'web') window.alert(successMsg);
          else Alert.alert('Cuenta Creada', successMsg);
          setIsSignUp(false);
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
      const errMsg = error.message || 'No se pudo completar la operación.';
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert('Error de Autenticación', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        if (error) throw error;
        return;
      }

      // Native Mobile (Android / iOS)
      const redirectUrl = 'drivera://';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        const authResponse = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (authResponse.type === 'success' && authResponse.url) {
          const success = await handleAuthUrl(authResponse.url);
          if (success) {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (error: any) {
      const msg = error.message || 'No se pudo iniciar sesión con Google.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Google OAuth', msg);
      }
    } finally {
      setLoading(false);
    }
  };

    const topInset = isDesktop ? 0 : Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top, 28) : insets.top;

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background, paddingTop: topInset }]}
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
            <Text style={[styles.appName, { color: colors.text }]}>Drivera</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>Control financiero para conductores</Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.formTitle, { color: colors.text }]}>
            {isSignUp ? 'Crear Cuenta de Usuario' : 'Acceso por Cuenta'}
          </Text>
          <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
            {isSignUp
              ? 'Complete los datos requeridos para registrar su cuenta individual de forma segura'
              : 'Es necesario contar con una cuenta activa para guardar y consultar sus registros'}
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

          {/* Email Input */}
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

          {/* Password Input */}
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

          {/* Registration Mode: Confirm Password & Password Standards Checklist */}
          {isSignUp && (
            <>
              {/* Confirm Password Field */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirmar Contraseña</Text>
                <View style={[
                  styles.inputWrapper,
                  { backgroundColor: colors.surface, borderColor: confirmPassword.length > 0 ? (isPasswordMatch ? colors.success : colors.danger) : colors.borderDark }
                ]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  {confirmPassword.length > 0 && (
                    <Ionicons
                      name={isPasswordMatch ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={isPasswordMatch ? colors.success : colors.danger}
                    />
                  )}
                </View>
                {confirmPassword.length > 0 && !isPasswordMatch && (
                  <Text style={[styles.matchErrorText, { color: colors.danger }]}>
                    Las contraseñas no coinciden
                  </Text>
                )}
              </View>

              {/* Password Standards Checklist */}
              <View style={[styles.checklistCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <Text style={[styles.checklistTitle, { color: colors.textSecondary }]}>
                  Estándares de Seguridad de la Contraseña:
                </Text>
                
                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasMinLength ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasMinLength ? colors.success : colors.textMuted}
                  />
                  <Text style={[styles.checkText, { color: hasMinLength ? colors.text : colors.textMuted }]}>
                    Mínimo 8 caracteres
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasUpper ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasUpper ? colors.success : colors.textMuted}
                  />
                  <Text style={[styles.checkText, { color: hasUpper ? colors.text : colors.textMuted }]}>
                    Al menos una letra mayúscula (A-Z)
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasNumber ? 'checkmark-circle' : 'ellipse-outline'}
                    size={14}
                    color={hasNumber ? colors.success : colors.textMuted}
                  />
                  <Text style={[styles.checkText, { color: hasNumber ? colors.text : colors.textMuted }]}>
                    Al menos un número (0-9)
                  </Text>
                </View>
              </View>
            </>
          )}

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
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setConfirmPassword('');
            }}
          >
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
  matchErrorText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  checklistCard: {
    borderRadius: RADIUS.sm,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
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
