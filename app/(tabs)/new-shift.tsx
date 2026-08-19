import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { LiveSummaryCard } from '../../components/LiveSummaryCard';
import { MiniDatePicker } from '../../components/MiniDatePicker';
import { calculateDailyMetrics } from '../../utils/calculations';
import { ShiftInput } from '../../types/database';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export default function NewShiftScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [shiftDate, setShiftDate] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [grossEarningsStr, setGrossEarningsStr] = useState('75000');
  const [cashCollectedStr, setCashCollectedStr] = useState('15000');
  const [hoursStr, setHoursStr] = useState('7');
  const [minutesStr, setMinutesStr] = useState('30');
  const [distanceKmStr, setDistanceKmStr] = useState('175');
  const [fuelConsumptionStr, setFuelConsumptionStr] = useState('7.4');
  const [gasPriceStr, setGasPriceStr] = useState('1450');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.default_consumption) {
        setFuelConsumptionStr(profile.default_consumption.toString());
      }
      if (profile.default_gas_price) {
        setGasPriceStr(profile.default_gas_price.toString());
      }
    }
  }, [profile]);

  const siiTaxRate = profile?.sii_tax_rate ?? 0.1525;

  const shiftInput: ShiftInput = useMemo(() => {
    return {
      grossEarnings: parseFloat(grossEarningsStr) || 0,
      cashCollected: parseFloat(cashCollectedStr) || 0,
      hours: parseFloat(hoursStr) || 0,
      minutes: parseFloat(minutesStr) || 0,
      distanceKm: parseFloat(distanceKmStr) || 0,
      fuelConsumption: parseFloat(fuelConsumptionStr) || 7.4,
      gasPricePerLiter: parseFloat(gasPriceStr) || 1450,
      siiTaxRate: siiTaxRate,
    };
  }, [
    grossEarningsStr,
    cashCollectedStr,
    hoursStr,
    minutesStr,
    distanceKmStr,
    fuelConsumptionStr,
    gasPriceStr,
    siiTaxRate,
  ]);

  const liveMetrics = useMemo(() => calculateDailyMetrics(shiftInput), [shiftInput]);

  const handleSaveShift = async () => {
    if (!grossEarningsStr || parseFloat(grossEarningsStr) <= 0) {
      Alert.alert('Atención', 'Por favor ingresa un monto válido de ganancia bruta.');
      return;
    }

    setSaving(true);
    try {
      const shiftData = {
        user_id: user?.id || 'demo-user-id',
        shift_date: shiftDate,
        gross_earnings: shiftInput.grossEarnings,
        cash_collected: shiftInput.cashCollected,
        hours: liveMetrics.totalHours,
        distance_km: shiftInput.distanceKm,
        fuel_consumption: shiftInput.fuelConsumption,
        gas_price_per_liter: shiftInput.gasPricePerLiter,
        sii_tax_rate: shiftInput.siiTaxRate,
        notes: notes.trim() || null,
        sii_tax_amount: liveMetrics.siiTaxAmount,
        app_balance: liveMetrics.appBalance,
        app_liquid: liveMetrics.appLiquid,
        fuel_liters: liveMetrics.fuelLiters,
        fuel_cost: liveMetrics.fuelCost,
        pocket_net: liveMetrics.pocketNet,
        pocket_net_per_hour: liveMetrics.pocketNetPerHour,
        pocket_net_per_km: liveMetrics.pocketNetPerKm,
        avg_speed_kmh: liveMetrics.avgSpeedKmh,
        is_deleted: false,
      };

      if (user) {
        const { error } = await supabase.from('daily_shifts').insert([shiftData]);
        if (error) throw error;
      }

      Alert.alert('Registro Exitoso', 'El turno ha sido guardado correctamente.', [
        {
          text: 'Ir al Dashboard',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el turno');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Registro de Jornada Operativa</Text>
        <Text style={styles.subtitle}>Ingrese las métricas observadas al cierre de turno</Text>

        {/* Live Metrics Summary Card */}
        <LiveSummaryCard metrics={liveMetrics} siiTaxRatePercentage={siiTaxRate * 100} />

        {/* Form Controls */}
        <View style={styles.formCard}>
          {/* Shift Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha de Operación</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={styles.inputIcon} />
              <Text style={styles.dateDisplayText}>{shiftDate}</Text>
              <Text style={styles.changeDateText}>Seleccionar</Text>
            </TouchableOpacity>
          </View>

          {/* Gross Earnings App ($ CLP) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ganancia Bruta en Plataforma ($ CLP)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={grossEarningsStr}
                onChangeText={setGrossEarningsStr}
                keyboardType="numeric"
                placeholder="75000"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Cash Collected in Hand ($ CLP) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Efectivo Recibido de Pasajeros ($ CLP)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={cashCollectedStr}
                onChangeText={setCashCollectedStr}
                keyboardType="numeric"
                placeholder="15000"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Connected Time */}
          <Text style={styles.label}>Tiempo Conectado Total</Text>
          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={hoursStr}
                  onChangeText={setHoursStr}
                  keyboardType="numeric"
                  placeholder="7"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.unitSuffix}>Horas</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={minutesStr}
                  onChangeText={setMinutesStr}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.unitSuffix}>Mins</Text>
              </View>
            </View>
          </View>

          {/* Odometer Mileage (km) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kilometraje Recorrido (Odómetro)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={distanceKmStr}
                onChangeText={setDistanceKmStr}
                keyboardType="decimal-pad"
                placeholder="175"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.unitSuffix}>km</Text>
            </View>
          </View>

          {/* Fuel Consumption & Gas Price */}
          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Consumo Promedio</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={fuelConsumptionStr}
                  onChangeText={setFuelConsumptionStr}
                  keyboardType="decimal-pad"
                  placeholder="7.4"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.unitSuffix}>L/100km</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Precio Combustible</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  value={gasPriceStr}
                  onChangeText={setGasPriceStr}
                  keyboardType="numeric"
                  placeholder="1450"
                  placeholderTextColor={COLORS.textMuted}
                />
                <Text style={styles.unitSuffix}>/L</Text>
              </View>
            </View>
          </View>

          {/* Optional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones Operativas</Text>
            <View style={[styles.inputWrapper, { height: 60, alignItems: 'flex-start', paddingTop: 8 }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                placeholder="Notas de la jornada..."
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveShift}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Registro Operativo</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <MiniDatePicker
        visible={showDatePicker}
        selectedDate={shiftDate}
        onSelectDate={setShiftDate}
        onClose={() => setShowDatePicker(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
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
  dateDisplayText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  changeDateText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  currencySymbol: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
  },
  unitSuffix: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
