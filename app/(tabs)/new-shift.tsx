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
        <Text style={styles.title}>Registro Diario de Turno</Text>
        <Text style={styles.subtitle}>Ingrese los valores observados al finalizar su jornada</Text>

        {/* Live Metrics Summary Card */}
        <LiveSummaryCard metrics={liveMetrics} siiTaxRatePercentage={siiTaxRate * 100} />

        {/* Form Controls */}
        <View style={styles.formCard}>
          {/* Shift Date with Mini Calendar Trigger */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fecha del Turno</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={18} color="#10B981" style={styles.inputIcon} />
              <Text style={styles.dateDisplayText}>{shiftDate}</Text>
              <Text style={styles.changeDateText}>Cambiar</Text>
            </TouchableOpacity>
          </View>

          {/* Gross Earnings App ($ CLP) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ganancia Bruta App ($ CLP)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={grossEarningsStr}
                onChangeText={setGrossEarningsStr}
                keyboardType="numeric"
                placeholder="75000"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Cash Collected in Hand ($ CLP) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Efectivo Cobrado a Pasajeros ($ CLP)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={cashCollectedStr}
                onChangeText={setCashCollectedStr}
                keyboardType="numeric"
                placeholder="15000"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Connected Time: Hours and Minutes */}
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
                  placeholderTextColor="#64748B"
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
                  placeholderTextColor="#64748B"
                />
                <Text style={styles.unitSuffix}>Mins</Text>
              </View>
            </View>
          </View>

          {/* Odometer Mileage (km) - MODIFIABLE PER SHIFT */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kilómetros Recorridos (Odómetro)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="speedometer-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={distanceKmStr}
                onChangeText={setDistanceKmStr}
                keyboardType="decimal-pad"
                placeholder="175"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.unitSuffix}>km</Text>
            </View>
          </View>

          {/* Fuel Consumption (L/100km) & Gas Price ($/L) - MODIFIABLE PER SHIFT */}
          <View style={styles.rowTwoInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Consumo Tablero</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={fuelConsumptionStr}
                  onChangeText={setFuelConsumptionStr}
                  keyboardType="decimal-pad"
                  placeholder="7.4"
                  placeholderTextColor="#64748B"
                />
                <Text style={styles.unitSuffix}>L/100km</Text>
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Precio Bencina</Text>
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
          </View>

          {/* Optional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observaciones (Opcional)</Text>
            <View style={[styles.inputWrapper, { height: 64, alignItems: 'flex-start', paddingTop: 8 }]}>
              <TextInput
                style={[styles.input, { textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                placeholder="Notas de la jornada..."
                placeholderTextColor="#64748B"
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
              <ActivityIndicator color="#0B0F17" />
            ) : (
              <>
                <Ionicons name="checkmark-sharp" size={20} color="#0B0F17" style={{ marginRight: 6 }} />
                <Text style={styles.saveButtonText}>Guardar Registro</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Popover Mini Date Picker */}
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
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#161E2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243044',
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
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  dateDisplayText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  changeDateText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
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
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#0B0F17',
    fontSize: 15,
    fontWeight: '800',
  },
});
