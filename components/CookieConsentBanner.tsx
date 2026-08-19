import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, RADIUS, SHADOWS } from '../constants/theme';
import { supabase } from '../lib/supabase';

const COOKIE_CONSENT_KEY = 'conductor_pro_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const consent = window.localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        setVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted_' + new Date().toISOString());
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={[styles.bannerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.primary }]}>Política de Cookies & Almacenamiento Necesario</Text>
          </View>

          <TouchableOpacity onPress={() => setShowDetails(!showDetails)}>
            <Text style={[styles.detailsToggleText, { color: colors.secondary }]}>
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Utilizamos cookies esenciales y almacenamiento local seguro estrictamente necesarios para mantener su sesión iniciada (Supabase Auth), autenticar su cuenta con Google y garantizar la persistencia de sus registros financieros.
        </Text>

        {showDetails && (
          <View style={[styles.detailsBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Cookies & Almacenamiento Utilizado:</Text>
            <Text style={[styles.detailsItem, { color: colors.textSecondary }]}>
              • <Text style={[styles.bold, { color: colors.text }]}>Tokens de Sesión (Supabase):</Text> Mantiene su autenticación cifrada en su navegador/dispositivo.
            </Text>
            <Text style={[styles.detailsItem, { color: colors.textSecondary }]}>
              • <Text style={[styles.bold, { color: colors.text }]}>Google OAuth:</Text> Permite el acceso directo seguro mediante su cuenta corporativa de Google.
            </Text>
            <Text style={[styles.detailsItem, { color: colors.textSecondary }]}>
              • <Text style={[styles.bold, { color: colors.text }]}>Preferencia Local:</Text> Almacena su configuración predeterminada de combustible y tasa SII.
            </Text>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.acceptButton, { backgroundColor: colors.primary }]} onPress={handleAccept} activeOpacity={0.8}>
            <Text style={[styles.acceptButtonText, { color: colors.primaryText }]}>Aceptar Cookies Necesarias</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    padding: 16,
    alignItems: 'center',
  },
  bannerContainer: {
    borderRadius: RADIUS.md,
    padding: 18,
    width: '100%',
    maxWidth: 760,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailsBox: {
    borderRadius: RADIUS.sm,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    gap: 6,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  detailsItem: {
    fontSize: 11,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
