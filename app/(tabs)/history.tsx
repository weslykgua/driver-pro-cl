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
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

export default function HistoryScreen() {
  const { user } = useAuth();
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
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Historial de Operaciones</Text>
          <Text style={styles.subtitle}>{shifts.filter((s) => !s.is_deleted).length} registros activos</Text>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={15} color={COLORS.primary} />
          <Text style={styles.exportButtonText}>Exportar CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: Active vs Papelera */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabSelectorButton, activeTab === 'active' && styles.tabSelectorActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabSelectorText, activeTab === 'active' && styles.tabSelectorTextActive]}>
            Registros Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSelectorButton, activeTab === 'trash' && styles.tabSelectorActiveTrash]}
          onPress={() => setActiveTab('trash')}
        >
          <Ionicons name="trash-outline" size={14} color={activeTab === 'trash' ? COLORS.danger : COLORS.textMuted} style={{ marginRight: 4 }} />
          <Text style={[styles.tabSelectorText, activeTab === 'trash' && styles.tabSelectorTextTrash]}>
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
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={24} color={COLORS.textMuted} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyText}>
              {activeTab === 'trash' ? 'La papelera está vacía.' : 'No hay turnos registrados en tu cuenta.'}
            </Text>
          </View>
        }
        renderItem={({ item }: { item: DailyShift }) => {
          const isExpanded = expandedId === item.id;
          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.8}
              >
                <View style={styles.dateBlock}>
                  <Text style={styles.dateText}>{formatDateSpanish(item.shift_date)}</Text>
                  <Text style={styles.subDateText}>{item.shift_date}</Text>
                </View>

                <View style={styles.pocketBlock}>
                  <Text style={styles.pocketNetValue}>{formatCLP(item.pocket_net)}</Text>
                  <Text style={styles.pocketNetLabel}>Líquido Neto</Text>
                </View>

                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </TouchableOpacity>

              {/* Collapsible Details */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ganancia Bruta Plataforma:</Text>
                      <Text style={styles.detailValue}>{formatCLP(item.gross_earnings)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Saldo Plataforma Transferible:</Text>
                      <Text style={[styles.detailValue, { color: COLORS.secondary }]}>
                        {formatCLP(item.app_balance)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Retención Legal SII (15.25%):</Text>
                      <Text style={[styles.detailValue, { color: COLORS.warning }]}>
                        -{formatCLP(item.sii_tax_amount)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kilómetros Recorridos:</Text>
                      <Text style={styles.detailValue}>{item.distance_km} km</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Consumo Promedio:</Text>
                      <Text style={styles.detailValue}>{item.fuel_consumption} L/100km</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Gasto Combustible ({item.fuel_liters} L):</Text>
                      <Text style={[styles.detailValue, { color: COLORS.danger }]}>
                        -{formatCLP(item.fuel_cost)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tiempo Conectado:</Text>
                      <Text style={styles.detailValue}>{formatHoursDecimal(item.hours)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rendimiento Real:</Text>
                      <Text style={[styles.detailValue, { color: COLORS.success }]}>
                        {formatCLP(item.pocket_net_per_hour)}/h | {formatCLP(item.pocket_net_per_km)}/km
                      </Text>
                    </View>

                    {item.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{item.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    {activeTab === 'active' ? (
                      <>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleOpenEditModal(item)}
                        >
                          <Ionicons name="create-outline" size={15} color={COLORS.primary} />
                          <Text style={styles.editButtonText}>Modificar Día</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.trashButton}
                          onPress={() => handleMoveToTrash(item.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                          <Text style={styles.trashButtonText}>Mover a Papelera</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.restoreButton}
                          onPress={() => handleRestoreFromTrash(item.id)}
                        >
                          <Ionicons name="refresh-outline" size={15} color={COLORS.success} />
                          <Text style={styles.restoreButtonText}>Restaurar Turno</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.permanentDeleteButton}
                          onPress={() => handlePermanentDelete(item.id)}
                        >
                          <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
                          <Text style={styles.permanentDeleteButtonText}>Eliminar Definitivamente</Text>
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
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Modificar Registro - {editingShift?.shift_date}
              </Text>
              <TouchableOpacity onPress={() => setEditingShift(null)}>
                <Ionicons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ganancia Bruta Plataforma ($ CLP)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGrossStr}
                  onChangeText={setEditGrossStr}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Horas Conectadas (Ej: 7.5)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editHoursStr}
                  onChangeText={setEditHoursStr}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kilómetros Recorridos (km)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editKmStr}
                  onChangeText={setEditKmStr}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Consumo Promedio (L/100km)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editConsumptionStr}
                  onChangeText={setEditConsumptionStr}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio Combustible ($/Litro)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGasPriceStr}
                  onChangeText={setEditGasPriceStr}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setEditingShift(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveEdit}
                disabled={savingEdit}
              >
                <Text style={styles.modalSaveText}>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  exportButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.neutralSoft,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
  },
  tabSelectorActiveTrash: {
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 1,
    borderColor: COLORS.danger + '33',
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabSelectorTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tabSelectorTextTrash: {
    color: COLORS.danger,
    fontWeight: '700',
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
    color: COLORS.textMuted,
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
  },
  subDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pocketBlock: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  pocketNetValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.success,
  },
  pocketNetLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
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
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  notesBox: {
    backgroundColor: COLORS.surfaceSubtle,
    padding: 8,
    borderRadius: RADIUS.sm,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.infoSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '22',
  },
  editButtonText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  trashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger + '22',
  },
  trashButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.success + '22',
  },
  restoreButtonText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '600',
  },
  permanentDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.dangerSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.danger + '44',
  },
  permanentDeleteButtonText: {
    color: COLORS.danger,
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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: COLORS.text,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderDark,
    color: COLORS.text,
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
    backgroundColor: COLORS.neutralSoft,
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
