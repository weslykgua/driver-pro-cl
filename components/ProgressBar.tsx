import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCLP } from '../utils/calculations';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, target, label = 'Meta Mensual Líquida' }) => {
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const remaining = Math.max(0, target - current);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.percentageText}>{percentage}%</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>

      {/* Bottom Details */}
      <View style={styles.footer}>
        <Text style={styles.currentText}>
          Acumulado: <Text style={styles.highlight}>{formatCLP(current)}</Text>
        </Text>
        <Text style={styles.remainingText}>
          {remaining > 0 ? `Restante: ${formatCLP(remaining)}` : 'Meta Cumplida'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 12,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.neutralSoft,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  currentText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  highlight: {
    color: COLORS.text,
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '600',
  },
});
