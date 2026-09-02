import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { CalculatedMetrics } from '../types/database';
import { formatCLP } from '../utils/calculations';
import { useTheme, RADIUS, SHADOWS } from '../constants/theme';

interface LiveSummaryCardProps {
  metrics: CalculatedMetrics;
  siiTaxRatePercentage: number;
}

export const LiveSummaryCard: React.FC<LiveSummaryCardProps> = ({ metrics, siiTaxRatePercentage }) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isNarrow = width < 380;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Main Net Income */}
      <View style={styles.heroContainer}>
        <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Líquido Neto Estimado en Bolsillo</Text>
        <Text
          style={[styles.heroValue, { color: colors.success }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {formatCLP(metrics.pocketNet)}
        </Text>
        <Text style={[styles.heroSubtext, { color: colors.textMuted }]}>
          Monto libre tras retención legal SII, combustible y peajes/TAG
        </Text>
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
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
            Combustible Estimado ({metrics.fuelLiters} L)
          </Text>
          <Text style={[styles.rowValue, { color: colors.danger }]}>
            -{formatCLP(metrics.fuelCost)}
          </Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Gasto Autopista / TAG</Text>
          <Text style={[styles.rowValue, { color: colors.danger }]}>
            -{formatCLP(metrics.highwayCost)}
          </Text>
        </View>

        {metrics.privateEarnings > 0 && (
          <View style={styles.gridRow}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Carreras Particulares</Text>
            <Text style={[styles.rowValue, { color: colors.success }]}>
              +{formatCLP(metrics.privateEarnings)}
            </Text>
          </View>
        )}

        <View style={styles.gridRow}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
            Retención Legal SII ({siiTaxRatePercentage.toFixed(2)}%)
          </Text>
          <Text style={[styles.rowValue, { color: colors.warning }]}>
            -{formatCLP(metrics.siiTaxAmount)}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Performance KPIs - Responsive Grid */}
      <View style={[styles.kpiRow, isNarrow && styles.kpiRowNarrow]}>
        <View style={[styles.kpiBox, isNarrow && styles.kpiBoxNarrow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
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

        <View style={[styles.kpiBox, isNarrow && styles.kpiBoxNarrow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
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

        <View style={[styles.kpiBox, isNarrow && styles.kpiBoxNarrowFull, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          <Text
            style={[styles.kpiLabel, { color: colors.textMuted }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
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
    width: '100%',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    marginVertical: 14,
    ...SHADOWS.card,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  heroValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  gridContainer: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    marginRight: 8,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 0,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
  },
  kpiRowNarrow: {
    flexWrap: 'wrap',
  },
  kpiBox: {
    flex: 1,
    minWidth: 90,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  kpiBoxNarrow: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  kpiBoxNarrowFull: {
    flexBasis: '100%',
    flexGrow: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 3,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
