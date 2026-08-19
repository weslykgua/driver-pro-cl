import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { DailyShift } from '../../types/database';
import { MetricCard } from '../../components/MetricCard';
import { ProgressBar } from '../../components/ProgressBar';
import { formatCLP } from '../../utils/calculations';

const MOCK_SHIFTS: DailyShift[] = [
  {
    id: '1',
    user_id: 'demo',
    shift_date: new Date().toISOString().split('T')[0],
    gross_earnings: 75000,
    cash_collected: 20000,
    hours: 7.5,
    distance_km: 180,
    fuel_consumption: 7.4,
    gas_price_per_liter: 1450,
    sii_tax_rate: 0.1525,
    sii_tax_amount: 11438,
    app_liquid: 63562,
    app_balance: 43562,
    fuel_liters: 13.32,
    fuel_cost: 19314,
    pocket_net: 44248,
    pocket_net_per_hour: 5900,
    pocket_net_per_km: 246,
    avg_speed_kmh: 24.0,
    is_deleted: false,
  },
  {
    id: '2',
    user_id: 'demo',
    shift_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    gross_earnings: 88000,
    cash_collected: 35000,
    hours: 8.0,
    distance_km: 210,
    fuel_consumption: 7.4,
    gas_price_per_liter: 1450,
    sii_tax_rate: 0.1525,
    sii_tax_amount: 13420,
    app_liquid: 74580,
    app_balance: 39580,
    fuel_liters: 15.54,
    fuel_cost: 22533,
    pocket_net: 52047,
    pocket_net_per_hour: 6506,
    pocket_net_per_km: 248,
    avg_speed_kmh: 26.3,
    is_deleted: false,
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [shifts, setShifts] = useState<DailyShift[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    try {
      if (!user) {
        setShifts(MOCK_SHIFTS);
        setLoading(false);
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const { data, error } = await supabase
        .from('daily_shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('shift_date', startOfMonth)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setShifts(data as DailyShift[]);
      } else {
        setShifts(MOCK_SHIFTS);
      }
    } catch (e) {
      console.warn('Error fetching shifts:', e);
      setShifts(MOCK_SHIFTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const activeShifts = shifts.filter((s) => !s.is_deleted);

  const monthlyTarget = profile?.monthly_pocket_target || 1300000;
  const totalPocketNet = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.pocket_net), 0);
  const totalFuelCost = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.fuel_cost), 0);
  const totalSiiTax = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.sii_tax_amount), 0);
  const totalCashCollected = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.cash_collected), 0);
  const totalAppBalance = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.app_balance), 0);
  const totalHours = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.hours), 0);
  const totalKm = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.distance_km), 0);

  const avgNetPerHour = totalHours > 0 ? Math.round(totalPocketNet / totalHours) : 0;
  const avgNetPerKm = totalKm > 0 ? Math.round(totalPocketNet / totalKm) : 0;

  const remainingPocket = Math.max(0, monthlyTarget - totalPocketNet);
  const hoursNeeded = avgNetPerHour > 0 ? Math.ceil(remainingPocket / avgNetPerHour) : 0;
  const avgHoursPerDay = activeShifts.length > 0 ? totalHours / activeShifts.length : 7.5;
  const daysNeeded = avgHoursPerDay > 0 ? Math.ceil(hoursNeeded / avgHoursPerDay) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
      }
    >
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcomeText}>Panel Consolidado Mensual</Text>
          <Text style={styles.dateBadgeText}>
            {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newShiftButton}
          onPress={() => router.push('/(tabs)/new-shift')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#0B0F17" />
          <Text style={styles.newShiftButtonText}>Nuevo Turno</Text>
        </TouchableOpacity>
      </View>

      {/* Target Progress Bar */}
      <ProgressBar current={totalPocketNet} target={monthlyTarget} label="Meta Líquida en Bolsillo" />

      {/* Corporate Pace Calculator Card */}
      <View style={styles.paceCard}>
        <View style={styles.paceHeaderRow}>
          <Ionicons name="speedometer-outline" size={18} color="#3B82F6" />
          <Text style={styles.paceTitle}>Calculador de Ritmo Operativo</Text>
        </View>

        {remainingPocket > 0 ? (
          <Text style={styles.paceBodyText}>
            Al promedio actual de <Text style={styles.paceHighlight}>{formatCLP(avgNetPerHour)}/h</Text>, se requieren aproximadamente{' '}
            <Text style={styles.paceHighlight}>{hoursNeeded} horas acumuladas</Text> (~{daysNeeded} jornadas de trabajo) para alcanzar la meta mensual.
          </Text>
        ) : (
          <Text style={styles.paceBodyTextSuccess}>
            Meta mensual cumplida ({formatCLP(monthlyTarget)}). Los ingresos adicionales corresponden a excedente neto.
          </Text>
        )}
      </View>

      {/* Main KPI Cards Grid */}
      <Text style={styles.sectionTitle}>Métricas Financieras del Mes</Text>

      <View style={styles.gridContainer}>
        {/* Total Pocket Net */}
        <MetricCard
          title="Bolsillo Libre Acumulado"
          value={formatCLP(totalPocketNet)}
          subtitle={`${activeShifts.length} turnos registrados`}
          iconName="wallet-outline"
          variant="emerald"
          style={styles.fullWidthCard}
        />

        <View style={styles.twoColumnRow}>
          <MetricCard
            title="Gasto Bencina Total"
            value={formatCLP(totalFuelCost)}
            subtitle="Combustible efectivo"
            iconName="flame-outline"
            variant="red"
            style={styles.halfCard}
          />
          <MetricCard
            title="Retención SII Total"
            value={formatCLP(totalSiiTax)}
            subtitle="Tasa 15.25%"
            iconName="receipt-outline"
            variant="amber"
            style={styles.halfCard}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <MetricCard
            title="Efectivo Cobrado"
            value={formatCLP(totalCashCollected)}
            subtitle="Cobrado en mano"
            iconName="cash-outline"
            variant="purple"
            style={styles.halfCard}
          />
          <MetricCard
            title="Saldo App Transferible"
            value={formatCLP(totalAppBalance)}
            subtitle="Saldo transferible"
            iconName="card-outline"
            variant="blue"
            style={styles.halfCard}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <MetricCard
            title="Promedio Real / Hora"
            value={`${formatCLP(avgNetPerHour)}/h`}
            subtitle={`${totalHours.toFixed(1)} hrs conectadas`}
            iconName="time-outline"
            variant="emerald"
            style={styles.halfCard}
          />
          <MetricCard
            title="Promedio Real / Km"
            value={`${formatCLP(avgNetPerKm)}/km`}
            subtitle={`${totalKm} km recorridos`}
            iconName="navigate-outline"
            variant="blue"
            style={styles.halfCard}
          />
        </View>
      </View>
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
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  dateBadgeText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  newShiftButton: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  newShiftButtonText: {
    color: '#0B0F17',
    fontWeight: '700',
    fontSize: 12,
  },
  paceCard: {
    backgroundColor: '#161E2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243044',
    marginBottom: 16,
  },
  paceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paceTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paceBodyText: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 20,
  },
  paceBodyTextSuccess: {
    fontSize: 13,
    color: '#10B981',
    lineHeight: 20,
    fontWeight: '600',
  },
  paceHighlight: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
    gap: 12,
  },
  fullWidthCard: {
    width: '100%',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
});
