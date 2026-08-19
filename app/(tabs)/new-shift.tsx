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
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';

export default function NewShiftScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors } = useTheme();

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [shiftDate, setShiftDate] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Clean empty defaults
  const [grossEarningsStr, setGrossEarningsStr] = useState('');
  const [hoursStr, setHoursStr] = useState('');
  const [minutesStr, setMinutesStr] = useState('');
  const [distanceKmStr, setDistanceKmStr] = useState('');
  const [fuelConsumptionStr, setFuelConsumptionStr] = useState('7.4');
  const [gasPriceStr, setGasPriceStr] = useState('1450');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
      cashCollected: 0,
      hours: parseFloat(hoursStr) || 0,
      minutes: parseFloat(minutesStr) || 0,
      distanceKm: parseFloat(distanceKmStr) || 0,
      fuelConsumption: parseFloat(fuelConsumptionStr) || 7.4,
      gasPricePerLiter: parseFloat(gasPriceStr) || 1450,
      siiTaxRate: siiTaxRate,
    };
  }, [
    grossEarningsStr,
    hoursStr,
    minutesStr,
    distanceKmStr,
    fuelConsumptionStr,
    gasPriceStr,
    siiTaxRate,
  ]);

  const liveMetrics = useMemo(() => calculateDailyMetrics(shiftInput), [shiftInput]);

  const executeSaveShift = async (existingId?: string) => {
    setSaving(true);
    try {
      const shiftData = {
        user_id: user?.id || 'demo-user-id',
        shift_date: shiftDate,
        gross_earnings: shiftInput.grossEarnings,
        cash_collected: 0,
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
        if (existingId) {
          // Overwrite existing shift for this date
          const { error } = await supabase
            .from('daily_shifts')
            .update(shiftData)
            .eq('id', existingId);
          if (error) throw error;
        } else {
          // Insert new shift
          const { error } = await supabase.from('daily_shifts').insert([shiftData]);
          if (error) throw error;
        }
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 900);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el turno');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShift = async () => {
    if (!grossEarningsStr || parseFloat(grossEarningsStr) <= 0) {
      Alert.alert('Atención', 'Por favor ingresa un monto válido de ganancia bruta.');
      return;
    }

    if (!user) {
      executeSaveShift();
      return;
    }

    // Check if shift already exists for this date
    try {
      const { data: existing } = await supabase
        .from('daily_shifts')
        .select('id')
        .eq('user_id', user.id)
        .eq('shift_date', shiftDate)
        .eq('is_deleted', false)
        .maybeSingle();

      if (existing) {
        Alert.alert(
          'Registro Ya Existente',
          `Ya existe un turno guardado para el día ${shiftDate}. ¿Deseas reemplazarlo con esta nueva información?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Reemplazar Registro',
              style: 'destructive',
              onPress: () => executeSaveShift(existing.id),
            },
          ]
        );
        return;
      }

      await executeSaveShift();
    } catch (e) {
      await executeSaveShift();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Registro de Jornada Operativa</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ingrese las métricas observadas al cierre de turno</Text>

        {/* Visual Confirmation Banner upon saving */}
        {saveSuccess && (
          <View style={[styles.successCard, { backgroundColor: colors.successSoft, borderColor: colors.success + '44' }]}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <View>
              <Text style={[styles.successTitle, { color: colors.success }]}>¡Turno Guardado Correctamente!</Text>
              <Text style={[styles.successSubtext, { color: colors.textSecondary }]}>Actualizando métricas consolidadas...</Text>
            </View>
          </View>
        )}

        {/* Live Metrics Summary Card */}
        <LiveSummaryCard metrics={liveMetrics} siiTaxRatePercentage={siiTaxRate * 100} />

        {/* Form Controls */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Shift Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Fecha de Operación</Text>
            <TouchableOpacity
              style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.inputIcon} />
              <Text style={[styles.dateDisplayText, { color: colors.text }]}>{shiftDate}</Text>
              <Text style={[styles.changeDateText, { color: colors.primary }]}>Seleccionar</Text>
            </TouchableOpacity>
          </View>

          {/* Gross Earnings App ($ CLP) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Ganancia Bruta en Plataforma ($ CLP)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
              <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={grossEarningsStr}
                onChangeText={setGrossEarningsStr}
                keyboardType="numeric"
                placeholder="Ej: 75000"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Connected Time */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Tiempo Conectado Total</Text>
          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={hoursStr}
                  onChangeText={setHoursStr}
                  keyboardType="numeric"
                  placeholder="Ej: 7"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>Horas</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={minutesStr}
                  onChangeText={setMinutesStr}
                  keyboardType="numeric"
                  placeholder="Ej: 30"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>Mins</Text>
              </View>
            </View>
          </View>

          {/* Odometer Mileage (km) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Kilometraje Recorrido (Odómetro)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
              <Ionicons name="navigate-outline" size={16} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={distanceKmStr}
                onChangeText={setDistanceKmStr}
                keyboardType="decimal-pad"
                placeholder="Ej: 175"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>km</Text>
            </View>
          </View>

          {/* Fuel Consumption & Gas Price */}
          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Consumo Promedio</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={fuelConsumptionStr}
                  onChangeText={setFuelConsumptionStr}
                  keyboardType="decimal-pad"
                  placeholder="7.4"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>L/100km</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Precio Combustible</Text>
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
          </View>

          {/* Optional Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Observaciones Operativas</Text>
            <View style={[styles.inputWrapper, { height: 60, alignItems: 'flex-start', paddingTop: 8, backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top', color: colors.text }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                placeholder="Notas opcionales de la jornada..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSaveShift}
            disabled={saving || saveSuccess}
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
    marginBottom: 8,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    marginVertical: 10,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  successSubtext: {
    fontSize: 12,
  },
  formCard: {
    borderRadius: RADIUS.md,
    padding: 18,
    borderWidth: 1,
    ...SHADOWS.card,
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
  dateDisplayText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  changeDateText: {
    fontSize: 12,
    fontWeight: '600',
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
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
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
