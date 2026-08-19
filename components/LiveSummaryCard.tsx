import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalculatedMetrics } from '../types/database';
import { formatCLP } from '../utils/calculations';
import { useTheme, RADIUS, SHADOWS } from '../constants/theme';

interface LiveSummaryCardProps {
  metrics: CalculatedMetrics;
  siiTaxRatePercentage: number;
}

export const LiveSummaryCard: React.FC<LiveSummaryCardProps> = ({ metrics, siiTaxRatePercentage }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Main Net Income */}
      <View style={styles.heroContainer}>
        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Líquido Neto Estimado en Bolsillo</Text>
        <Text
          style={[styles.heroValue, { color: colors.success }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {formatCLP(metrics.pocketNet)}
        </Text>
        <Text style={[styles.heroSubtext, { color: colors.textMuted }]}>Monto disponible tras retención legal SII y gasto estimado de combustible</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Breakdown Items */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Saldo App Transferible</Text>
          <Text style={[styles.rowValue, { color: metrics.appBalance >= 0 ? colors.secondary : colors.danger }]}>
            {formatCLP(metrics.appBalance)}
          </Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Combustible Estimado ({metrics.fuelLiters} L)</Text>
          <Text style={[styles.rowValue, { color: colors.danger }]}>-{formatCLP(metrics.fuelCost)}</Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Retención Legal SII ({siiTaxRatePercentage.toFixed(2)}%)</Text>
          <Text style={[styles.rowValue, { color: colors.warning }]}>-{formatCLP(metrics.siiTaxAmount)}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Performance KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Rendimiento / Hora
          </Text>
          <Text
            style={[styles.kpiValue, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatCLP(metrics.pocketNetPerHour)}/h
          </Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Rendimiento / Km
          </Text>
          <Text
            style={[styles.kpiValue, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {formatCLP(metrics.pocketNetPerKm)}/km
          </Text>
        </View>

        <View style={[styles.kpiBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            Velocidad Promedio
          </Text>
          <Text
            style={[styles.kpiValue, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {metrics.avgSpeedKmh} km/h
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: 20,
    borderWidth: 1,
    marginVertical: 14,
    ...SHADOWS.card,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heroSubtext: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
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
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
