import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme, Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  border: string;
  borderDark: string;
  primary: string;       // #22C55E (Verde Financiero)
  primaryHover: string;
  primaryText: string;   // #07110A
  secondary: string;     // #3B82F6 (Azul Secundario)
  text: string;          // #F1F5F9
  textSecondary: string; // #94A3B8
  textMuted: string;     // #64748B
  success: string;       // #22C55E
  successSoft: string;   // #064E3B
  danger: string;        // #EF4444
  dangerSoft: string;    // #450A0A
  warning: string;       // #F59E0B
  warningSoft: string;   // #78350F
  info: string;          // #3B82F6
  infoSoft: string;      // #1E3A8A
  neutralSoft: string;   // #1A212B
  isDark: boolean;
}

export const DARK_FINTECH_COLORS: ThemeColors = {
  background: '#0B0F14',
  backgroundSecondary: '#11161D',
  surface: '#151B23',
  surfaceElevated: '#1A212B',
  surfaceSubtle: '#11161D',
  border: '#252D38',
  borderDark: '#334155',
  primary: '#22C55E',
  primaryHover: '#16A34A',
  primaryText: '#07110A',
  secondary: '#3B82F6',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  success: '#22C55E',
  successSoft: '#064E3B',
  danger: '#EF4444',
  dangerSoft: '#450A0A',
  warning: '#F59E0B',
  warningSoft: '#78350F',
  info: '#3B82F6',
  infoSoft: '#1E3A8A',
  neutralSoft: '#1A212B',
  isDark: true,
};

export const LIGHT_FINTECH_COLORS: ThemeColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FAFC',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderDark: '#CBD5E1',
  primary: '#16A34A',
  primaryHover: '#15803D',
  primaryText: '#FFFFFF',
  secondary: '#2563EB',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  info: '#2563EB',
  infoSoft: '#DBEAFE',
  neutralSoft: '#F1F5F9',
  isDark: false,
};

export const COLORS = DARK_FINTECH_COLORS;

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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'triprate_theme_mode_v2';

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'dark',
  colors: DARK_FINTECH_COLORS,
  setThemeMode: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

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
    } else {
      setThemeMode('light');
    }
  };

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && deviceScheme === 'dark');

  const colors = isDark ? DARK_FINTECH_COLORS : LIGHT_FINTECH_COLORS;

  return React.createElement(
    ThemeContext.Provider,
    { value: { themeMode, colors, setThemeMode, toggleTheme } },
    children
  );
};

export const useTheme = () => useContext(ThemeContext);
