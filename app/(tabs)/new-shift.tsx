import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  useWindowDimensions,
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
import { saveShiftDraft, loadShiftDraft, clearShiftDraft } from '../../utils/draftStorage';

interface VehicleBrandPreset {
  id: string;
  name: string;
  consumption: string;
}

const VEHICLE_BRANDS: VehicleBrandPreset[] = [
  { id: 'suzuki', name: 'Suzuki', consumption: '5.8' },
  { id: 'toyota', name: 'Toyota', consumption: '6.2' },
  { id: 'chevrolet', name: 'Chevrolet', consumption: '6.8' },
  { id: 'hyundai', name: 'Hyundai', consumption: '7.0' },
  { id: 'kia', name: 'Kia', consumption: '7.1' },
  { id: 'nissan', name: 'Nissan', consumption: '7.4' },
  { id: 'hibrido', name: 'Híbrido', consumption: '4.5' },
];

export default function NewShiftScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [shiftDate, setShiftDate] = useState(getTodayString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form Fields
  const [grossEarningsStr, setGrossEarningsStr] = useState('');
  const [cashCollectedStr, setCashCollectedStr] = useState('');
  const [highwayCostStr, setHighwayCostStr] = useState('');
  const [privateEarningsStr, setPrivateEarningsStr] = useState('');
  const [showPrivateSection, setShowPrivateSection] = useState(false);
  const [hoursStr, setHoursStr] = useState('');
  const [minutesStr, setMinutesStr] = useState('');
  const [distanceKmStr, setDistanceKmStr] = useState('');
  const [fuelConsumptionStr, setFuelConsumptionStr] = useState('7.4');
  const [gasPriceStr, setGasPriceStr] = useState('1450');
  const [notes, setNotes] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // Status flags
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User edit tracking to avoid overwriting typed values
  const hasUserEditedConsumptionRef = useRef(false);
  const hasUserEditedGasPriceRef = useRef(false);

  // 1. Initial load from draft or defaults
  useEffect(() => {
    let isMounted = true;

    const initForm = async () => {
      const draft = await loadShiftDraft();
      if (!isMounted) return;

      if (draft) {
        if (draft.shiftDate) setShiftDate(draft.shiftDate);
        if (draft.grossEarningsStr !== undefined) setGrossEarningsStr(draft.grossEarningsStr);
        if (draft.cashCollectedStr !== undefined) setCashCollectedStr(draft.cashCollectedStr);
        if (draft.highwayCostStr !== undefined) setHighwayCostStr(draft.highwayCostStr);
        if (draft.privateEarningsStr !== undefined) setPrivateEarningsStr(draft.privateEarningsStr);
        if (draft.showPrivateSection !== undefined) setShowPrivateSection(draft.showPrivateSection);
        if (draft.hoursStr !== undefined) setHoursStr(draft.hoursStr);
        if (draft.minutesStr !== undefined) setMinutesStr(draft.minutesStr);
        if (draft.distanceKmStr !== undefined) setDistanceKmStr(draft.distanceKmStr);
        if (draft.notes !== undefined) setNotes(draft.notes);
        if (draft.selectedBrand !== undefined) setSelectedBrand(draft.selectedBrand);

        if (draft.fuelConsumptionStr !== undefined && draft.fuelConsumptionStr !== '') {
          setFuelConsumptionStr(draft.fuelConsumptionStr);
          hasUserEditedConsumptionRef.current = true;
        } else if (profile?.default_consumption) {
          setFuelConsumptionStr(profile.default_consumption.toString());
        }

        if (draft.gasPriceStr !== undefined && draft.gasPriceStr !== '') {
          setGasPriceStr(draft.gasPriceStr);
          hasUserEditedGasPriceRef.current = true;
        } else if (profile?.default_gas_price) {
          setGasPriceStr(profile.default_gas_price.toString());
        }

        const hasAnyContent = Boolean(
          draft.grossEarningsStr ||
          draft.distanceKmStr ||
          draft.hoursStr ||
          draft.cashCollectedStr ||
          draft.highwayCostStr
        );
        if (hasAnyContent) {
          setIsDraftRestored(true);
        }
      } else {
        // No draft, apply profile defaults
        if (profile?.default_consumption) {
          setFuelConsumptionStr(profile.default_consumption.toString());
        }
        if (profile?.default_gas_price) {
          setGasPriceStr(profile.default_gas_price.toString());
        }
      }

      setIsLoaded(true);
    };

    initForm();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Profile default sync: only runs if user hasn't typed anything yet
  useEffect(() => {
    if (!isLoaded) return;
    if (profile) {
      if (!hasUserEditedConsumptionRef.current && profile.default_consumption) {
        setFuelConsumptionStr(profile.default_consumption.toString());
      }
      if (!hasUserEditedGasPriceRef.current && profile.default_gas_price) {
        setGasPriceStr(profile.default_gas_price.toString());
      }
    }
  }, [profile, isLoaded]);

  // 3. Auto-save draft on change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      saveShiftDraft({
        shiftDate,
        grossEarningsStr,
        cashCollectedStr,
        highwayCostStr,
        privateEarningsStr,
        showPrivateSection,
        hoursStr,
        minutesStr,
        distanceKmStr,
        fuelConsumptionStr,
        gasPriceStr,
        notes,
        selectedBrand: selectedBrand || undefined,
        hasUserEditedConsumption: hasUserEditedConsumptionRef.current,
        hasUserEditedGasPrice: hasUserEditedGasPriceRef.current,
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [
    isLoaded,
    shiftDate,
    grossEarningsStr,
    cashCollectedStr,
    highwayCostStr,
    privateEarningsStr,
    showPrivateSection,
    hoursStr,
    minutesStr,
    distanceKmStr,
    fuelConsumptionStr,
    gasPriceStr,
    notes,
    selectedBrand,
  ]);

  const handleClearDraft = async () => {
    await clearShiftDraft();
    setGrossEarningsStr('');
    setCashCollectedStr('');
    setHighwayCostStr('');
    setPrivateEarningsStr('');
    setShowPrivateSection(false);
    setHoursStr('');
    setMinutesStr('');
    setDistanceKmStr('');
    setNotes('');
    setSelectedBrand(null);
    hasUserEditedConsumptionRef.current = false;
    hasUserEditedGasPriceRef.current = false;
    setFuelConsumptionStr(profile?.default_consumption ? profile.default_consumption.toString() : '7.4');
    setGasPriceStr(profile?.default_gas_price ? profile.default_gas_price.toString() : '1450');
    setIsDraftRestored(false);
  };

  const siiTaxRate = profile?.sii_tax_rate ?? 0.1525;

  const shiftInput: ShiftInput = useMemo(() => {
    return {
      grossEarnings: parseFloat(grossEarningsStr) || 0,
      cashCollected: parseFloat(cashCollectedStr) || 0,
      highwayCost: parseFloat(highwayCostStr) || 0,
      privateEarnings: parseFloat(privateEarningsStr) || 0,
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
    highwayCostStr,
    privateEarningsStr,
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
        cash_collected: shiftInput.cashCollected,
        highway_cost: shiftInput.highwayCost,
        private_earnings: shiftInput.privateEarnings,
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
          const { error } = await supabase
            .from('daily_shifts')
            .update(shiftData)
            .eq('id', existingId);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('daily_shifts').insert([shiftData]);
          if (error) throw error;
        }
      }

      await clearShiftDraft();
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
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        <View style={styles.responsiveWrapper}>
          <Text style={[styles.title, { color: colors.text }]}>Registro de Jornada Operativa</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ingrese las métricas observadas al cierre de turno
          </Text>

          {/* Draft Restored Notification Banner */}
          {isDraftRestored && !saveSuccess && (
            <View style={[styles.draftCard, { backgroundColor: colors.neutralSoft, borderColor: colors.borderDark }]}>
              <View style={styles.draftCardContent}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                <Text style={[styles.draftText, { color: colors.textSecondary }]}>
                  Borrador anterior recuperado
                </Text>
              </View>
              <TouchableOpacity onPress={handleClearDraft} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.draftActionText, { color: colors.warning }]}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          )}

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

            {/* Cash Collected & Highway/TAG Expenses (Responsive) */}
            <View style={isNarrow ? styles.columnInputs : styles.rowTwoInputs}>
              <View style={[styles.inputGroup, !isNarrow && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Efectivo Recibido ($)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={cashCollectedStr}
                    onChangeText={setCashCollectedStr}
                    keyboardType="numeric"
                    placeholder="Ej: 15000"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, !isNarrow && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Gasto Autopista/TAG ($)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={highwayCostStr}
                    onChangeText={setHighwayCostStr}
                    keyboardType="numeric"
                    placeholder="Ej: 4500"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Optional Button / Card for Private / Off-App Rides */}
            {!showPrivateSection ? (
              <TouchableOpacity
                style={[styles.addPrivateButton, { backgroundColor: colors.neutralSoft, borderColor: colors.borderDark }]}
                onPress={() => setShowPrivateSection(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="car-sport-outline" size={16} color={colors.primary} />
                <Text style={[styles.addPrivateButtonText, { color: colors.primary }]}>
                  + Agregar Carrera Fuera de Uber / Particular
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.privateSectionCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                <View style={styles.privateHeaderRow}>
                  <Text style={[styles.label, { color: colors.success, marginBottom: 0 }]}>
                    Carreras Fuera de Uber / Particulares
                  </Text>
                  <TouchableOpacity onPress={() => { setPrivateEarningsStr(''); setShowPrivateSection(false); }}>
                    <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark, marginTop: 8 }]}>
                  <Text style={[styles.currencySymbol, { color: colors.success }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={privateEarningsStr}
                    onChangeText={setPrivateEarningsStr}
                    keyboardType="numeric"
                    placeholder="Ej: 25000"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <Text style={[styles.privateHelpText, { color: colors.textMuted }]}>
                  Ingresos directos particulares sin comisión de app ni retención SII.
                </Text>
              </View>
            )}

            {/* Connected Time (Hours & Mins) */}
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

            {/* Vehicle Brands Selector */}
            <View style={styles.brandSelectorContainer}>
              <View style={styles.brandHeaderRow}>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>Marcas y Rendimientos Frecuentes</Text>
                <Text style={[styles.brandHint, { color: colors.textMuted }]}>Toca para autocompletar</Text>
              </View>
              <View style={styles.brandChipsWrap}>
                {VEHICLE_BRANDS.map((item) => {
                  const isSelected = selectedBrand === item.id || fuelConsumptionStr === item.consumption;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.brandChip,
                        { backgroundColor: colors.surfaceSubtle, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.neutralSoft, borderColor: colors.primary }
                      ]}
                      onPress={() => {
                        setSelectedBrand(item.id);
                        setFuelConsumptionStr(item.consumption);
                        hasUserEditedConsumptionRef.current = true;
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.brandChipName, { color: isSelected ? colors.primary : colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.brandChipValue, { color: isSelected ? colors.primary : colors.textMuted }]}>
                        {item.consumption} L
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Fuel Consumption & Gas Price (Responsive) */}
            <View style={isNarrow ? styles.columnInputs : styles.rowTwoInputs}>
              <View style={[styles.inputGroup, !isNarrow && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Consumo Promedio</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={fuelConsumptionStr}
                    onChangeText={(val) => {
                      hasUserEditedConsumptionRef.current = true;
                      setFuelConsumptionStr(val);
                      setSelectedBrand(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="7.4"
                    placeholderTextColor={colors.textMuted}
                  />
                  <Text style={[styles.unitSuffix, { color: colors.textMuted }]}>L/100km</Text>
                </View>
              </View>

              <View style={[styles.inputGroup, !isNarrow && { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Precio Combustible</Text>
                <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.borderDark }]}>
                  <Text style={[styles.currencySymbol, { color: colors.primary }]}>$</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={gasPriceStr}
                    onChangeText={(val) => {
                      hasUserEditedGasPriceRef.current = true;
                      setGasPriceStr(val);
                    }}
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
    alignItems: 'center',
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 640,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  draftCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftText: {
    fontSize: 12,
    fontWeight: '500',
  },
  draftActionText: {
    fontSize: 12,
    fontWeight: '700',
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
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 46,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  dateDisplayText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  changeDateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  currencySymbol: {
    fontWeight: '600',
    fontSize: 15,
    marginRight: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  unitSuffix: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  columnInputs: {
    flexDirection: 'column',
  },
  brandSelectorContainer: {
    marginBottom: 14,
    paddingTop: 4,
  },
  brandHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandHint: {
    fontSize: 10,
    fontWeight: '500',
  },
  brandChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  brandChipName: {
    fontSize: 11,
    fontWeight: '600',
  },
  brandChipValue: {
    fontSize: 11,
    fontWeight: '500',
  },
  saveButton: {
    height: 46,
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
  addPrivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  addPrivateButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  privateSectionCard: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  privateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privateHelpText: {
    fontSize: 10,
    marginTop: 6,
  },
});
