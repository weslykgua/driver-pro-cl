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
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { colors } = useTheme();

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
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="normal"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Brand Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>TripRate</Text>
          <Text style={[styles.brandSubtext, { color: colors.textSecondary }]}>
            Control financiero para conductores
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/new-shift')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={colors.primaryText} />
          <Text style={[styles.primaryButtonText, { color: colors.primaryText }]}>Registrar Turno</Text>
        </TouchableOpacity>
      </View>

      {/* Target Progress Bar */}
      <ProgressBar current={totalPocketNet} target={monthlyTarget} label="Meta Mensual Líquida" />

      {/* Empty State Banner if no shifts */}
      {activeShifts.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin turnos registrados este mes</Text>
          <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
            Presione el botón "Registrar Turno" para ingresar su primera jornada del mes.
          </Text>
        </View>
      ) : (
        /* Corporate Pace Calculator */
        <View style={[styles.paceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.paceHeaderRow}>
            <Ionicons name="calculator-outline" size={16} color={colors.primary} />
            <Text style={[styles.paceTitle, { color: colors.primary }]}>Proyección Operativa</Text>
          </View>

          {remainingPocket > 0 ? (
            <Text style={[styles.paceBodyText, { color: colors.textSecondary }]}>
              A una tasa promedio de <Text style={[styles.paceHighlight, { color: colors.text }]}>{formatCLP(avgNetPerHour)}/h</Text>, se requieren aproximadamente{' '}
              <Text style={[styles.paceHighlight, { color: colors.text }]}>{hoursNeeded} horas</Text> (~{daysNeeded} jornadas) para alcanzar el objetivo mensual.
            </Text>
          ) : (
            <Text style={[styles.paceBodyTextSuccess, { color: colors.success }]}>
              Meta de {formatCLP(monthlyTarget)} alcanzada. Los ingresos adicionales constituyen excedente neto.
            </Text>
          )}
        </View>
      )}

      {/* Main KPI Cards Grid */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Métricas Financieras del Período</Text>

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

        <View style={styles.twoColumnRow}>
          <MetricCard
            title="Promedio / Km"
            value={`${formatCLP(avgNetPerKm)}/km`}
            subtitle={`${totalKm} km recorridos`}
            iconName="navigate-outline"
            variant="blue"
            style={styles.fullWidthCard}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  brandSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  primaryButton: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    gap: 6,
  },
  primaryButtonText: {
    fontWeight: '700',
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: RADIUS.md,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 16,
    ...SHADOWS.card,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  paceCard: {
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
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
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paceBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  paceBodyTextSuccess: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  paceHighlight: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
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
