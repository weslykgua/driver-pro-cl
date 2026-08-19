import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { DailyShift } from '../../types/database';
import { MetricCard } from '../../components/MetricCard';
import { ProgressBar } from '../../components/ProgressBar';
import { formatCLP } from '../../utils/calculations';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [shifts, setShifts] = useState<DailyShift[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    try {
      if (!user) {
        setShifts([]);
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

      setShifts((data as DailyShift[]) || []);
    } catch (e) {
      console.warn('Error fetching shifts:', e);
      setShifts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Re-fetch automatically whenever Dashboard screen receives focus
  useFocusEffect(
    useCallback(() => {
      fetchShifts();
    }, [fetchShifts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchShifts();
  };

  const activeShifts = shifts.filter((s) => !s.is_deleted);

  const monthlyTarget = profile?.monthly_pocket_target || 1300000;
  const totalPocketNet = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.pocket_net), 0);
  const totalFuelCost = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.fuel_cost), 0);
  const totalSiiTax = activeShifts.reduce((sum: number, s: DailyShift) => sum + Number(s.sii_tax_amount), 0);
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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.welcomeText}>Resumen Consolidado</Text>
          <Text style={styles.dateBadgeText}>
            {new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newShiftButton}
          onPress={() => router.push('/(tabs)/new-shift')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.newShiftButtonText}>Registrar Turno</Text>
        </TouchableOpacity>
      </View>

      {/* Target Progress Bar */}
      <ProgressBar current={totalPocketNet} target={monthlyTarget} label="Meta Mensual Líquida" />

      {/* Empty State Banner if no shifts */}
      {activeShifts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyTitle}>Sin turnos registrados este mes</Text>
          <Text style={styles.emptySubtext}>
            Presione el botón "Registrar Turno" arriba para ingresar su primera jornada del mes.
          </Text>
        </View>
      ) : (
        /* Corporate Pace Calculator */
        <View style={styles.paceCard}>
          <View style={styles.paceHeaderRow}>
            <Ionicons name="calculator-outline" size={16} color={COLORS.primary} />
            <Text style={styles.paceTitle}>Proyección Operativa</Text>
          </View>

          {remainingPocket > 0 ? (
            <Text style={styles.paceBodyText}>
              A una tasa promedio de <Text style={styles.paceHighlight}>{formatCLP(avgNetPerHour)}/h</Text>, se requieren aproximadamente{' '}
              <Text style={styles.paceHighlight}>{hoursNeeded} horas</Text> (~{daysNeeded} jornadas) para alcanzar el objetivo mensual.
            </Text>
          ) : (
            <Text style={styles.paceBodyTextSuccess}>
              Meta de {formatCLP(monthlyTarget)} alcanzada. Los ingresos adicionales constituyen excedente neto.
            </Text>
          )}
        </View>
      )}

      {/* Main KPI Cards Grid */}
      <Text style={styles.sectionTitle}>Métricas Financieras del Período</Text>

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
            subtitle="Tasa legal 15.25%"
            iconName="receipt-outline"
            variant="amber"
            style={styles.halfCard}
          />
        </View>

        <View style={styles.twoColumnRow}>
          <MetricCard
            title="Saldo App Transferible"
            value={formatCLP(totalAppBalance)}
            subtitle="Saldo en plataforma"
            iconName="card-outline"
            variant="blue"
            style={styles.halfCard}
          />
          <MetricCard
            title="Promedio / Hora"
            value={`${formatCLP(avgNetPerHour)}/h`}
            subtitle={`${totalHours.toFixed(1)} hrs conectadas`}
            iconName="time-outline"
            variant="emerald"
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
    backgroundColor: COLORS.background,
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
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  dateBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  newShiftButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    gap: 6,
  },
  newShiftButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  paceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  paceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  paceTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  paceBodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  paceBodyTextSuccess: {
    fontSize: 13,
    color: COLORS.success,
    lineHeight: 20,
    fontWeight: '600',
  },
  paceHighlight: {
    color: COLORS.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 8,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
