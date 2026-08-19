import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from './_layout';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '../constants/theme';

export default function RootIndex() {
  const { session, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
