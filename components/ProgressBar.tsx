import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { formatCLP } from '../utils/calculations';

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

      {/* Bottom details */}
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
    backgroundColor: '#161E2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243044',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10B981',
  },
  track: {
    height: 8,
    backgroundColor: '#0B0F17',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#243044',
  },
  fill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  currentText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  highlight: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  remainingText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
