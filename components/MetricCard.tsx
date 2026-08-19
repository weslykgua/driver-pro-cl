import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, RADIUS, SHADOWS } from '../constants/theme';

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
  const { colors } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'emerald':
        return { valueColor: colors.primary, badgeBg: colors.successSoft, badgeText: colors.primary };
      case 'red':
        return { valueColor: colors.danger, badgeBg: colors.dangerSoft, badgeText: colors.danger };
      case 'amber':
        return { valueColor: colors.warning, badgeBg: colors.warningSoft, badgeText: colors.warning };
      case 'blue':
        return { valueColor: colors.secondary, badgeBg: colors.infoSoft, badgeText: colors.secondary };
      default:
        return { valueColor: colors.text, badgeBg: colors.neutralSoft, badgeText: colors.textSecondary };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border },
      style
    ]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
          {title}
        </Text>
        {iconName && (
          <View style={[styles.iconWrapper, { backgroundColor: colors.neutralSoft }]}>
            <Ionicons name={iconName} size={15} color={colors.textSecondary} />
          </View>
        )}
      </View>

      <Text style={[styles.value, { color: vStyles.valueColor }]}>{value}</Text>
      
      {subtitle && (
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
    marginRight: 8,
  },
  iconWrapper: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    marginTop: 6,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '400',
  },
});
