import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { formatCLP } from '../../utils/calculations';
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { colors, themeMode, setThemeMode } = useTheme();

  const [monthlyTargetStr, setMonthlyTargetStr] = useState('1300000');
  const [gasPriceStr, setGasPriceStr] = useState('1450');
  const [consumptionStr, setConsumptionStr] = useState('7.4');
  const [taxRateStr, setTaxRateStr] = useState('15.25');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setMonthlyTargetStr((profile.monthly_pocket_target || 1300000).toString());
      setGasPriceStr((profile.default_gas_price || 1450).toString());
      setConsumptionStr((profile.default_consumption || 7.4).toString());
      setTaxRateStr(((profile.sii_tax_rate || 0.1525) * 100).toString());
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const targetVal = parseFloat(monthlyTargetStr) || 1300000;
      const gasPriceVal = parseFloat(gasPriceStr) || 1450;
      const consumptionVal = parseFloat(consumptionStr) || 7.4;
      const taxRateVal = (parseFloat(taxRateStr) || 15.25) / 100;

      if (user) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          monthly_pocket_target: targetVal,
          default_gas_price: gasPriceVal,
          default_consumption: consumptionVal,
          sii_tax_rate: taxRateVal,
        });

        if (error) throw error;
        await refreshProfile();
      }

      if (Platform.OS === 'web') {
        window.alert('Configuración Guardada: Se han actualizado los parámetros por defecto.');
      } else {
        Alert.alert('Configuración Guardada', 'Se han actualizado los parámetros por defecto.');
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert(e.message || 'No se pudieron guardar los ajustes');
      } else {
        Alert.alert('Error', e.message || 'No se pudieron guardar los ajustes');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      const confirmSignOut = typeof window !== 'undefined' ? window.confirm('¿Desea cerrar su sesión activa en Drivera?') : true;
      if (confirmSignOut) {
        await signOut();
      }
      return;
    }

    Alert.alert('Cerrar Sesión', '¿Desea cerrar su sesión activa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.text }]}>Parámetros del Sistema</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Configuración de variables financieras, apariencia y tasas por defecto</Text>

      {/* User profile card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.neutralSoft, borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.userEmail, { color: colors.text }]}>{user?.email || 'Cuenta no autenticada'}</Text>
          <Text style={[styles.userStatus, { color: colors.success }]}>Sesión Activa</Text>
        </View>
      </View>

      {/* Theme Mode Selector Card */}
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Apariencia Visual (Modo Día / Noche)</Text>
        
        <View style={styles.themeOptionsRow}>
          <TouchableOpacity
            style={[
              styles.themeOptionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              themeMode === 'system' && { borderColor: colors.primary, backgroundColor: colors.neutralSoft }
            ]}
            onPress={() => setThemeMode('system')}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={themeMode === 'system' ? colors.primary : colors.textMuted} />
            <Text style={[styles.themeOptionText, { color: themeMode === 'system' ? colors.primary : colors.textSecondary }]}>Sistema</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOptionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              themeMode === 'light' && { borderColor: colors.primary, backgroundColor: colors.neutralSoft }
            ]}
            onPress={() => setThemeMode('light')}
          >
            <Ionicons name="sunny-outline" size={18} color={themeMode === 'light' ? colors.primary : colors.textMuted} />
            <Text style={[styles.themeOptionText, { color: themeMode === 'light' ? colors.primary : colors.textSecondary }]}>Día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOptionButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              themeMode === 'dark' && { borderColor: colors.primary, backgroundColor: colors.neutralSoft }
            ]}
            onPress={() => setThemeMode('dark')}
          >
            <Ionicons name="moon-outline" size={18} color={themeMode === 'dark' ? colors.primary : colors.textMuted} />
            <Text style={[styles.themeOptionText, { color: themeMode === 'dark' ? colors.primary : colors.textSecondary }]}>Noche</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Form */}
      <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Configuración Operativa de la Cuenta</Text>

        {/* Monthly Target */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Meta Mensual Líquida ($ CLP)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={monthlyTargetStr}
              onChangeText={setMonthlyTargetStr}
              keyboardType="numeric"
              placeholder="1300000"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Objetivo actual: {formatCLP(parseFloat(monthlyTargetStr) || 0)} líquidos en bolsillo
          </Text>
        </View>

        {/* Default Gas Price */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Precio Combustible Predeterminado ($/Litro)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
            <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={gasPriceStr}
              onChangeText={setGasPriceStr}
              keyboardType="numeric"
              placeholder="1450"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>/L</Text>
          </View>
        </View>

        {/* Default Consumption */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Consumo Promedio Vehículo (L/100km)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
            <Ionicons name="navigate-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={consumptionStr}
              onChangeText={setConsumptionStr}
              keyboardType="decimal-pad"
              placeholder="7.4"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>L/100km</Text>
          </View>
        </View>

        {/* SII Tax Rate */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tasa de Retención SII (%)</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
            <Ionicons name="receipt-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={taxRateStr}
              onChangeText={setTaxRateStr}
              keyboardType="decimal-pad"
              placeholder="15.25"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>%</Text>
          </View>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>Tasa legal aplicada a servicios de transporte en Chile</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.primaryText }]}>Guardar Configuración de Cuenta</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.dangerSoft }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <Ionicons name="log-out-outline" size={16} color={colors.danger} style={{ marginRight: 6 }} />
        <Text style={[styles.logoutButtonText, { color: colors.danger }]}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  profileInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '600',
  },
  userStatus: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: RADIUS.md,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 6,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
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
  currencySymbol: {
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
  unitSuffix: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
  },
  saveButton: {
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
