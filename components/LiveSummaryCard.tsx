import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalculatedMetrics } from '../types/database';
import { formatCLP } from '../utils/calculations';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

interface LiveSummaryCardProps {
  metrics: CalculatedMetrics;
  siiTaxRatePercentage: number;
}

export const LiveSummaryCard: React.FC<LiveSummaryCardProps> = ({ metrics, siiTaxRatePercentage }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <View style={styles.statusDot} />
          <Text style={styles.headerTitle}>RESUMEN EN TIEMPO REAL</Text>
        </View>
      </View>

      {/* Main Net Income */}
      <View style={styles.heroContainer}>
        <Text style={styles.heroLabel}>Líquido Neto Estimado en Bolsillo</Text>
        <Text style={styles.heroValue}>{formatCLP(metrics.pocketNet)}</Text>
        <Text style={styles.heroSubtext}>Monto disponible tras retención legal SII y gasto estimado de combustible</Text>
      </View>

      <View style={styles.divider} />

      {/* Breakdown Items */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Saldo App Transferible</Text>
          <Text style={[styles.rowValue, { color: metrics.appBalance >= 0 ? COLORS.secondary : COLORS.danger }]}>
            {formatCLP(metrics.appBalance)}
          </Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Combustible Estimado ({metrics.fuelLiters} L)</Text>
          <Text style={[styles.rowValue, { color: COLORS.danger }]}>-{formatCLP(metrics.fuelCost)}</Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Retención Legal SII ({siiTaxRatePercentage.toFixed(2)}%)</Text>
          <Text style={[styles.rowValue, { color: COLORS.warning }]}>-{formatCLP(metrics.siiTaxAmount)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Performance KPIs */}
      <View style={styles.kpiRow}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Rendimiento / Hora</Text>
          <Text style={styles.kpiValue}>{formatCLP(metrics.pocketNetPerHour)}/h</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Rendimiento / Km</Text>
          <Text style={styles.kpiValue}>{formatCLP(metrics.pocketNetPerKm)}/km</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>Velocidad Promedio</Text>
          <Text style={styles.kpiValue}>{metrics.avgSpeedKmh} km/h</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 14,
    ...SHADOWS.card,
  },
  headerRow: {
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 0.8,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: -0.5,
  },
  heroSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  gridContainer: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '700',
  },
});
