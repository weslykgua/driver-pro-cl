import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const is4k = Platform.OS === 'web' && width >= 1800;

  return (
    <View style={styles.webWrapper}>
      <View style={[styles.webContainer, isDesktop && styles.desktopContainer, is4k && styles.container4k]}>
        {/* Desktop Web Institutional Header */}
        {isDesktop && (
          <View style={styles.desktopHeader}>
            <View style={styles.desktopBrand}>
              <View style={styles.desktopLogoBadge}>
                <Ionicons name="bar-chart-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.desktopBrandName}>Conductor Pro</Text>
                <Text style={styles.desktopBrandSubtitle}>Gestión Financiera & Control Operativo</Text>
              </View>
            </View>

            <View style={styles.desktopSecurityBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.success} />
              <Text style={styles.desktopSecurityText}>Plataforma Segura</Text>
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: COLORS.primary,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarStyle: {
                backgroundColor: COLORS.surface,
                borderTopColor: COLORS.border,
                borderTopWidth: 1,
                height: isDesktop ? 60 : Platform.OS === 'ios' ? 84 : 60,
                paddingBottom: isDesktop ? 8 : Platform.OS === 'ios' ? 24 : 8,
                paddingTop: 8,
              },
              tabBarLabelStyle: {
                fontSize: isDesktop ? 12 : 11,
                fontWeight: '600',
              },
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="pie-chart-outline" size={isDesktop ? size : size - 2} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="new-shift"
              options={{
                title: 'Registrar',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="add-circle-outline" size={isDesktop ? size + 2 : size} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="history"
              options={{
                title: 'Historial',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="document-text-outline" size={isDesktop ? size : size - 2} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Ajustes',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="options-outline" size={isDesktop ? size : size - 2} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    maxWidth: 780,
    backgroundColor: COLORS.background,
  },
  desktopContainer: {
    maxWidth: 980,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  container4k: {
    maxWidth: 1200,
  },
  tabsContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  desktopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  desktopBrandName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  desktopBrandSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  desktopSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  desktopSecurityText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
});
