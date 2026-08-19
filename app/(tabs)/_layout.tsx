import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, RADIUS } from '../../constants/theme';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { colors, toggleTheme, themeMode } = useTheme();

  const isDesktop = Platform.OS === 'web' && width >= 768;
  const is4k = Platform.OS === 'web' && width >= 1800;

  return (
    <View style={[styles.webWrapper, { backgroundColor: colors.background }]}>
      <View style={[
        styles.webContainer,
        { backgroundColor: colors.background },
        isDesktop && [styles.desktopContainer, { borderColor: colors.border, backgroundColor: colors.surface }],
        is4k && styles.container4k
      ]}>
        {/* Header (Desktop or Mobile top bar for theme toggle) */}
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.desktopBrand}>
            <View style={[styles.desktopLogoBadge, { backgroundColor: colors.neutralSoft, borderColor: colors.border }]}>
              <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.desktopBrandName, { color: colors.primary }]}>TripRate</Text>
              <Text style={[styles.desktopBrandSubtitle, { color: colors.textMuted }]}>Gestión Financiera & Control Operativo</Text>
            </View>
          </View>

          {/* Theme Toggle Button (Day / Night Mode) */}
          <TouchableOpacity
            style={[styles.themeToggleButton, { backgroundColor: colors.neutralSoft, borderColor: colors.border }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
            aria-label="Cambiar tema día/noche"
          >
            <Ionicons
              name={colors.isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.isDark ? '#F59E0B' : colors.primary}
            />
            <Text style={[styles.themeToggleText, { color: colors.textSecondary }]}>
              {colors.isDark ? 'Día' : 'Noche'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
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
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    maxWidth: 780,
  },
  desktopContainer: {
    maxWidth: 980,
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  container4k: {
    maxWidth: 1280,
  },
  tabsContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  desktopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  desktopLogoBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  desktopBrandName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  desktopBrandSubtitle: {
    fontSize: 11,
  },
  themeToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    gap: 6,
  },
  themeToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
