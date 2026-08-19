import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'slate';
  style?: StyleProp<ViewStyle>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  iconName,
  variant = 'slate',
  style,
}) => {
  const getColors = () => {
    switch (variant) {
      case 'emerald':
        return { iconBg: '#064E3B', iconColor: '#10B981', border: '#05966944' };
      case 'amber':
        return { iconBg: '#78350F', iconColor: '#F59E0B', border: '#D9770644' };
      case 'red':
        return { iconBg: '#7F1D1D', iconColor: '#EF4444', border: '#DC262644' };
      case 'blue':
        return { iconBg: '#1E3A8A', iconColor: '#3B82F6', border: '#2563EB44' };
      case 'purple':
        return { iconBg: '#581C87', iconColor: '#A855F7', border: '#9333EA44' };
      default:
        return { iconBg: '#1E293B', iconColor: '#94A3B8', border: '#334155' };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.card, { borderColor: colors.border }, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {iconName && (
          <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
            <Ionicons name={iconName} size={16} color={colors.iconColor} />
          </View>
        )}
      </View>

      <Text style={[styles.value, variant === 'emerald' && styles.emeraldText]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161E2E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243044',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  emeraldText: {
    color: '#10B981',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
});
