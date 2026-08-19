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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { formatCLP } from '../../utils/calculations';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();

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

      Alert.alert('Configuración Guardada', 'Se han actualizado los parámetros por defecto.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudieron guardar los ajustes');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Cerrar Sesión', '¿Desea finalizar la sesión activa?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ajustes del Sistema</Text>
      <Text style={styles.subtitle}>Configuración de parámetros financieros y valores predeterminados</Text>

      {/* User profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person-outline" size={20} color="#10B981" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userEmail}>{user?.email || 'Usuario Demo (Modo Evaluación)'}</Text>
          <Text style={styles.userStatus}>Perfil de Conductor Activo</Text>
        </View>
      </View>

      {/* Settings Form */}
      <View style={styles.formCard}>
        <Text style={styles.sectionHeader}>Parámetros Operativos Predeterminados</Text>

        {/* Monthly Target */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Meta Mensual Líquida ($ CLP)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={monthlyTargetStr}
              onChangeText={setMonthlyTargetStr}
              keyboardType="numeric"
              placeholder="1300000"
              placeholderTextColor="#64748B"
            />
          </View>
          <Text style={styles.helperText}>
            Objetivo actual: {formatCLP(parseFloat(monthlyTargetStr) || 0)} líquidos en bolsillo
          </Text>
        </View>

        {/* Default Gas Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Precio Combustible Predeterminado ($/Litro)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              value={gasPriceStr}
              onChangeText={setGasPriceStr}
              keyboardType="numeric"
              placeholder="1450"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.unitSuffix}>/L</Text>
          </View>
        </View>

        {/* Default Consumption */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Consumo Promedio Vehículo (L/100km)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="speedometer-outline" size={16} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={consumptionStr}
              onChangeText={setConsumptionStr}
              keyboardType="decimal-pad"
              placeholder="7.4"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.unitSuffix}>L/100km</Text>
          </View>
        </View>

        {/* SII Tax Rate */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tasa de Retención SII (%)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="receipt-outline" size={16} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={taxRateStr}
              onChangeText={setTaxRateStr}
              keyboardType="decimal-pad"
              placeholder="15.25"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.unitSuffix}>%</Text>
          </View>
          <Text style={styles.helperText}>Porcentaje legal aplicado a retención SII en Chile</Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#0B0F17" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar Configuración</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F17',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161E2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243044',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  profileInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  userStatus: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#161E2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243044',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#243044',
    paddingHorizontal: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  currencySymbol: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 15,
    marginRight: 6,
  },
  unitSuffix: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 6,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#10B981',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#0B0F17',
    fontSize: 14,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EF444433',
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
