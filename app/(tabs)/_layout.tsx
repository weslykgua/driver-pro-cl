import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;
  const is4k = Platform.OS === 'web' && width >= 1800;

  return (
    <View style={styles.webWrapper}>
      <View style={[styles.webContainer, isDesktop && styles.desktopContainer, is4k && styles.container4k]}>
        {/* Desktop Web Brand Top Header Bar */}
        {isDesktop && (
          <View style={styles.desktopHeader}>
            <View style={styles.desktopBrand}>
              <View style={styles.desktopLogoBadge}>
                <Ionicons name="bar-chart" size={20} color="#10B981" />
              </View>
              <View>
                <Text style={styles.desktopBrandName}>Conductor Pro</Text>
                <Text style={styles.desktopBrandSubtitle}>Gestión Financiera para Conductores</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.tabsContainer}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#10B981',
              tabBarInactiveTintColor: '#64748B',
              tabBarStyle: {
                backgroundColor: '#161E2E',
                borderTopColor: '#243044',
                borderTopWidth: 1,
                height: isDesktop ? 64 : Platform.OS === 'ios' ? 88 : 64,
                paddingBottom: isDesktop ? 8 : Platform.OS === 'ios' ? 28 : 10,
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
                  <Ionicons name="stats-chart" size={isDesktop ? size + 1 : size} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="new-shift"
              options={{
                title: '+ Registrar Turno',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="add-circle" size={isDesktop ? size + 4 : size + 2} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="history"
              options={{
                title: 'Historial',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="time" size={isDesktop ? size + 1 : size} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="settings"
              options={{
                title: 'Ajustes',
                tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                  <Ionicons name="settings-sharp" size={isDesktop ? size + 1 : size} color={color} />
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
    backgroundColor: '#0B0F17',
    alignItems: 'center',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    maxWidth: 760,
    backgroundColor: '#0B0F17',
  },
  desktopContainer: {
    maxWidth: 960,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#243044',
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
    backgroundColor: '#161E2E',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#243044',
  },
  desktopBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  desktopLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  desktopBrandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  desktopBrandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
