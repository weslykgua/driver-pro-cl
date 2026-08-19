import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme, Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceSubtle: string;
  border: string;
  borderDark: string;
  primary: string;
  primaryHover: string;
  secondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  neutralSoft: string;
  isDark: boolean;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceSubtle: '#F8FAFC',
  border: '#E2E6EB',
  borderDark: '#D9DEE5',
  primary: '#123B5D',
  primaryHover: '#0E2E49',
  secondary: '#1F5A7A',
  text: '#172033',
  textSecondary: '#5F6B7A',
  textMuted: '#8A94A3',
  success: '#287A5A',
  successSoft: '#E8F4EE',
  danger: '#B54747',
  dangerSoft: '#FDF2F2',
  warning: '#A87520',
  warningSoft: '#FDF8EE',
  info: '#1F5A7A',
  infoSoft: '#F0F5F9',
  neutralSoft: '#F1F3F5',
  isDark: false,
};

export const DARK_COLORS: ThemeColors = {
  background: '#0B0F17',
  surface: '#161E2E',
  surfaceSubtle: '#1D2638',
  border: '#243044',
  borderDark: '#334155',
  primary: '#38BDF8',
  primaryHover: '#0284C7',
  secondary: '#38BDF8',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#34D399',
  successSoft: '#064E3B',
  danger: '#F87171',
  dangerSoft: '#7F1D1D',
  warning: '#FBBF24',
  warningSoft: '#78350F',
  info: '#38BDF8',
  infoSoft: '#0C4A6E',
  neutralSoft: '#1E293B',
  isDark: true,
};

// Fallback constant for backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'triprate_theme_mode_v1';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  colors: LIGHT_COLORS,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        setThemeModeState(saved);
      }
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
  };

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('light');
    } else {
      setThemeMode(deviceScheme === 'dark' ? 'light' : 'dark');
    }
  };

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && deviceScheme === 'dark');

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, colors, setThemeMode, toggleTheme } },
    children
  );
};

export const useTheme = () => useContext(ThemeContext);
