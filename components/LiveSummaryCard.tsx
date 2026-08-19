import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CalculatedMetrics } from '../types/database';
import { formatCLP } from '../utils/calculations';

interface LiveSummaryCardProps {
  metrics: CalculatedMetrics;
  siiTaxRatePercentage: number;
}

export const LiveSummaryCard: React.FC<LiveSummaryCardProps> = ({ metrics, siiTaxRatePercentage }) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.indicatorContainer}>
          <View style={styles.activeDot} />
          <Text style={styles.headerTitle}>RESUMEN FINANCIERO EN TIEMPO REAL</Text>
        </View>
      </View>

      {/* Main Net Pocket Income */}
      <View style={styles.heroContainer}>
        <Text style={styles.heroLabel}>Líquido Neto en Bolsillo</Text>
        <Text style={styles.heroValue}>{formatCLP(metrics.pocketNet)}</Text>
        <Text style={styles.heroSubtext}>Resultado libre descontando impuestos (SII) y combustible</Text>
      </View>

      <View style={styles.divider} />

      {/* Breakdown Grid */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Saldo App Transferible</Text>
          <Text style={[styles.rowValue, { color: metrics.appBalance >= 0 ? '#3B82F6' : '#EF4444' }]}>
            {formatCLP(metrics.appBalance)}
          </Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Combustible Consumido ({metrics.fuelLiters} L)</Text>
          <Text style={[styles.rowValue, { color: '#EF4444' }]}>-{formatCLP(metrics.fuelCost)}</Text>
        </View>

        <View style={styles.gridRow}>
          <Text style={styles.rowLabel}>Retención SII ({siiTaxRatePercentage.toFixed(2)}%)</Text>
          <Text style={[styles.rowValue, { color: '#F59E0B' }]}>-{formatCLP(metrics.siiTaxAmount)}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Corporate Performance Indicators */}
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
    backgroundColor: '#161E2E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#05966966',
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 1.2,
  },
  heroContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: -1,
  },
  heroSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#243044',
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
    color: '#CBD5E1',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243044',
  },
  kpiLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
