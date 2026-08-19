import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../constants/theme';

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
  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return { valueColor: COLORS.success, badgeBg: COLORS.successSoft, badgeText: COLORS.success };
      case 'red':
        return { valueColor: COLORS.danger, badgeBg: COLORS.dangerSoft, badgeText: COLORS.danger };
      case 'amber':
        return { valueColor: COLORS.warning, badgeBg: COLORS.warningSoft, badgeText: COLORS.warning };
      case 'blue':
        return { valueColor: COLORS.primary, badgeBg: COLORS.infoSoft, badgeText: COLORS.primary };
      default:
        return { valueColor: COLORS.text, badgeBg: COLORS.neutralSoft, badgeText: COLORS.textSecondary };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {iconName && (
          <View style={styles.iconWrapper}>
            <Ionicons name={iconName} size={16} color={COLORS.textSecondary} />
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: vStyles.valueColor }]}>{value}</Text>
      
      {subtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    marginTop: 6,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
});
