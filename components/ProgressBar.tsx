import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCLP } from '../utils/calculations';
import { useTheme, RADIUS, SHADOWS } from '../constants/theme';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, target, label = 'Meta Mensual Líquida' }) => {
  const { colors } = useTheme();
  const percentage = target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;
  const remaining = Math.max(0, target - current);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.percentageText, { color: colors.primary }]}>{percentage}% completado</Text>
      </View>

      <Text style={[styles.targetValue, { color: colors.text }]}>{formatCLP(target)}</Text>

      {/* Progress Track */}
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
      </View>

      {/* Bottom Details */}
      <View style={styles.footer}>
        <Text style={[styles.currentText, { color: colors.textSecondary }]}>
          Acumulado: <Text style={[styles.highlight, { color: colors.primary }]}>{formatCLP(current)}</Text>
        </Text>
        <Text style={[styles.remainingText, { color: colors.secondary }]}>
          {remaining > 0 ? `Restante: ${formatCLP(remaining)}` : 'Meta Cumplida'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    padding: 18,
    borderWidth: 1,
    marginVertical: 12,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  currentText: {
    fontSize: 12,
  },
  highlight: {
    fontWeight: '600',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
