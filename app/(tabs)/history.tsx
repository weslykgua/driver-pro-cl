import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { DailyShift, ShiftInput } from '../../types/database';
import { formatCLP, formatDateSpanish, formatHoursDecimal, calculateDailyMetrics } from '../../utils/calculations';
import { useTheme, RADIUS, SHADOWS } from '../../constants/theme';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [shifts, setShifts] = useState<DailyShift[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editingShift, setEditingShift] = useState<DailyShift | null>(null);
  const [editGrossStr, setEditGrossStr] = useState('');
  const [editHoursStr, setEditHoursStr] = useState('');
  const [editKmStr, setEditKmStr] = useState('');
  const [editConsumptionStr, setEditConsumptionStr] = useState('');
  const [editGasPriceStr, setEditGasPriceStr] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      if (!user) {
        setShifts([]);
        return;
      }

      const { data, error } = await supabase
        .from('daily_shifts')
        .select('*')
        .eq('user_id', user.id)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      setShifts((data as DailyShift[]) || []);
    } catch (e) {
      console.warn('Error loading history:', e);
      setShifts([]);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  // Re-fetch automatically when screen receives focus
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const displayedShifts = shifts.filter((s) =>
    activeTab === 'trash' ? s.is_deleted === true : !s.is_deleted
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleMoveToTrash = async (shiftId: string) => {
    try {
      if (user) {
        await supabase
          .from('daily_shifts')
          .update({ is_deleted: true })
          .eq('id', shiftId);
      }
      setShifts((prev: DailyShift[]) =>
        prev.map((s: DailyShift) => (s.id === shiftId ? { ...s, is_deleted: true } : s))
      );
      Alert.alert('Papelera', 'El turno ha sido trasladado a la papelera.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo mover el registro a la papelera.');
    }
  };

  const handleRestoreFromTrash = async (shiftId: string) => {
    try {
      if (user) {
        await supabase
          .from('daily_shifts')
          .update({ is_deleted: false })
          .eq('id', shiftId);
      }
      setShifts((prev: DailyShift[]) =>
        prev.map((s: DailyShift) => (s.id === shiftId ? { ...s, is_deleted: false } : s))
      );
      Alert.alert('Restaurado', 'El registro se ha restaurado correctamente.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo restaurar el registro.');
    }
  };

  const handlePermanentDelete = (shiftId: string) => {
    Alert.alert(
      'Eliminación Definitiva',
      '¿Desea eliminar de forma permanente este registro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Definitivamente',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user) {
                await supabase.from('daily_shifts').delete().eq('id', shiftId);
              }
              setShifts((prev: DailyShift[]) => prev.filter((s: DailyShift) => s.id !== shiftId));
            } catch (e) {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  const handleOpenEditModal = (shift: DailyShift) => {
    setEditingShift(shift);
    setEditGrossStr(shift.gross_earnings.toString());
    setEditHoursStr(shift.hours.toString());
    setEditKmStr(shift.distance_km.toString());
    setEditConsumptionStr(shift.fuel_consumption.toString());
    setEditGasPriceStr(shift.gas_price_per_liter.toString());
  };

  const handleSaveEdit = async () => {
    if (!editingShift) return;

    setSavingEdit(true);
    try {
      const gross = parseFloat(editGrossStr) || 0;
      const hours = parseFloat(editHoursStr) || 0;
      const distanceKm = parseFloat(editKmStr) || 0;
      const fuelConsumption = parseFloat(editConsumptionStr) || 7.4;
      const gasPrice = parseFloat(editGasPriceStr) || 1450;

      const input: ShiftInput = {
        grossEarnings: gross,
        cashCollected: 0,
        hours: Math.floor(hours),
        minutes: Math.round((hours - Math.floor(hours)) * 60),
        distanceKm,
        fuelConsumption,
        gasPricePerLiter: gasPrice,
        siiTaxRate: editingShift.sii_tax_rate,
      };

      const metrics = calculateDailyMetrics(input);

      const updatedShiftData = {
        gross_earnings: gross,
        cash_collected: 0,
        hours: metrics.totalHours,
        distance_km: distanceKm,
        fuel_consumption: fuelConsumption,
        gas_price_per_liter: gasPrice,
        sii_tax_amount: metrics.siiTaxAmount,
        app_balance: metrics.appBalance,
        app_liquid: metrics.appLiquid,
        fuel_liters: metrics.fuelLiters,
        fuel_cost: metrics.fuelCost,
        pocket_net: metrics.pocketNet,
        pocket_net_per_hour: metrics.pocketNetPerHour,
        pocket_net_per_km: metrics.pocketNetPerKm,
        avg_speed_kmh: metrics.avgSpeedKmh,
      };

      if (user) {
        const { error } = await supabase
          .from('daily_shifts')
          .update(updatedShiftData)
          .eq('id', editingShift.id);

        if (error) throw error;
      }

      setShifts((prev: DailyShift[]) =>
        prev.map((s: DailyShift) =>
          s.id === editingShift.id ? { ...s, ...updatedShiftData } : s
        )
      );

      setEditingShift(null);
      Alert.alert('Actualización Exitosa', 'Los registros se han actualizado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la modificación.');
    } finally {
      setSavingEdit(false);
    }
  };

  const exportToCSV = () => {
    const activeShifts = shifts.filter((s) => !s.is_deleted);
    if (activeShifts.length === 0) {
      Alert.alert('Exportar', 'No hay registros activos para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Bruto CLP',
      'Horas Conectado',
      'Km Recorridos',
      'Consumo L/100km',
      'Retencion SII CLP',
      'Saldo App CLP',
      'Bencina Gastada CLP',
      'Bolsillo Neto CLP',
      'CLP por Hora',
      'CLP por Km',
      'Notas',
    ];

    const rows = activeShifts.map((s: DailyShift) => [
      s.shift_date,
      s.gross_earnings,
      s.hours,
      s.distance_km,
      s.fuel_consumption,
      s.sii_tax_amount,
      s.app_balance,
      s.fuel_cost,
      s.pocket_net,
      s.pocket_net_per_hour,
      s.pocket_net_per_km,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: (string | number)[]) => r.join(','))].join('\n');

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `historial_turnos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('CSV Generado', 'Los datos están listos para ser exportados');
    }
  };

  const trashCount = shifts.filter((s) => s.is_deleted).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Historial de Operaciones</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{shifts.filter((s) => !s.is_deleted).length} registros activos</Text>
        </View>

        <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.surface, borderColor: colors.borderDark }]} onPress={exportToCSV} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={15} color={colors.primary} />
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>Exportar CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: Active vs Papelera */}
      <View style={[styles.tabSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabSelectorButton, activeTab === 'active' && [styles.tabSelectorActive, { backgroundColor: colors.neutralSoft, borderColor: colors.borderDark }]]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabSelectorText, { color: activeTab === 'active' ? colors.primary : colors.textMuted }]}>
            Registros Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSelectorButton, activeTab === 'trash' && [styles.tabSelectorActiveTrash, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '33' }]]}
          onPress={() => setActiveTab('trash')}
        >
          <Ionicons name="trash-outline" size={14} color={activeTab === 'trash' ? colors.danger : colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[styles.tabSelectorText, { color: activeTab === 'trash' ? colors.danger : colors.textMuted }]}>
            Papelera ({trashCount})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayedShifts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchHistory();
            }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={24} color={colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {activeTab === 'trash' ? 'La papelera está vacía.' : 'No hay turnos registrados en tu cuenta.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: DailyShift }) => {
          const isExpanded = expandedId === item.id;
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.dateBlock}>
                  <Text style={[styles.dateText, { color: colors.text }]}>{formatDateSpanish(item.shift_date)}</Text>
                  <Text style={[styles.subDateText, { color: colors.textMuted }]}>{item.shift_date}</Text>
                </View>

                <View style={styles.pocketBlock}>
                  <Text style={[styles.pocketNetValue, { color: colors.success }]}>{formatCLP(item.pocket_net)}</Text>
                  <Text style={[styles.pocketNetLabel, { color: colors.textMuted }]}>Líquido Neto</Text>
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {/* Collapsible Details */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Ganancia Bruta Plataforma:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{formatCLP(item.gross_earnings)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Saldo Plataforma Transferible:</Text>
                      <Text style={[styles.detailValue, { color: colors.secondary }]}>
                        {formatCLP(item.app_balance)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Retención Legal SII (15.25%):</Text>
                      <Text style={[styles.detailValue, { color: colors.warning }]}>
                        -{formatCLP(item.sii_tax_amount)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Kilómetros Recorridos:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{item.distance_km} km</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Consumo Promedio:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{item.fuel_consumption} L/100km</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Gasto Combustible ({item.fuel_liters} L):</Text>
                      <Text style={[styles.detailValue, { color: colors.danger }]}>
                        -{formatCLP(item.fuel_cost)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tiempo Conectado:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>{formatHoursDecimal(item.hours)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Rendimiento Real:</Text>
                      <Text style={[styles.detailValue, { color: colors.success }]}>
                        {formatCLP(item.pocket_net_per_hour)}/h | {formatCLP(item.pocket_net_per_km)}/km
                      </Text>
                    </View>

                    {item.notes ? (
                      <View style={[styles.notesBox, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{item.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    {activeTab === 'active' ? (
                      <>
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: colors.infoSoft, borderColor: colors.primary + '22' }]}
                          onPress={() => handleOpenEditModal(item)}
                        >
                          <Ionicons name="create-outline" size={15} color={colors.primary} />
                          <Text style={[styles.editButtonText, { color: colors.primary }]}>Modificar Día</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.trashButton, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '22' }]}
                          onPress={() => handleMoveToTrash(item.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color={colors.danger} />
                          <Text style={[styles.trashButtonText, { color: colors.danger }]}>Mover a Papelera</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[styles.restoreButton, { backgroundColor: colors.successSoft, borderColor: colors.success + '22' }]}
                          onPress={() => handleRestoreFromTrash(item.id)}
                        >
                          <Ionicons name="refresh-outline" size={15} color={colors.success} />
                          <Text style={[styles.restoreButtonText, { color: colors.success }]}>Restaurar Turno</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.permanentDeleteButton, { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '44' }]}
                          onPress={() => handlePermanentDelete(item.id)}
                        >
                          <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
                          <Text style={[styles.permanentDeleteButtonText, { color: colors.danger }]}>Eliminar Definitivamente</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Edit Shift Modal */}
      <Modal visible={!!editingShift} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Modificar Registro - {editingShift?.shift_date}
              </Text>
              <TouchableOpacity onPress={() => setEditingShift(null)}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ganancia Bruta Plataforma ($ CLP)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.borderDark, color: colors.text }]}
                  value={editGrossStr}
                  onChangeText={setEditGrossStr}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Horas Conectadas (Ej: 7.5)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.borderDark, color: colors.text }]}
                  value={editHoursStr}
                  onChangeText={setEditHoursStr}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Kilómetros Recorridos (km)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.borderDark, color: colors.text }]}
                  value={editKmStr}
                  onChangeText={setEditKmStr}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Consumo Promedio (L/100km)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.borderDark, color: colors.text }]}
                  value={editConsumptionStr}
                  onChangeText={setEditConsumptionStr}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Precio Combustible ($/Litro)</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.surface, borderColor: colors.borderDark, color: colors.text }]}
                  value={editGasPriceStr}
                  onChangeText={setEditGasPriceStr}
                  keyboardType="numeric"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { backgroundColor: colors.neutralSoft }]}
                onPress={() => setEditingShift(null)}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <Text style={[styles.modalSaveText, { color: colors.primaryText }]}>
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  exportButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: RADIUS.sm,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
  },
  tabSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm - 2,
  },
  tabSelectorActive: {
    borderWidth: 1,
  },
  tabSelectorActiveTrash: {
    borderWidth: 1,
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 30,
    gap: 10,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dateBlock: {
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subDateText: {
    fontSize: 11,
    marginTop: 2,
  },
  pocketBlock: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  pocketNetValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  pocketNetLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    marginBottom: 10,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesBox: {
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  trashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  trashButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  restoreButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  permanentDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  permanentDeleteButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: RADIUS.md,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalInput: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
