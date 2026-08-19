import React, { useEffect, useState, useCallback } from 'react';
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
import { useAuth } from '../_layout';
import { supabase } from '../../lib/supabase';
import { DailyShift, ShiftInput } from '../../types/database';
import { formatCLP, formatDateSpanish, formatHoursDecimal, calculateDailyMetrics } from '../../utils/calculations';

const DEMO_HISTORY: DailyShift[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    shift_date: '2026-08-18',
    gross_earnings: 82000,
    cash_collected: 25000,
    hours: 8.0,
    distance_km: 195,
    fuel_consumption: 7.4,
    gas_price_per_liter: 1450,
    sii_tax_rate: 0.1525,
    sii_tax_amount: 12505,
    app_liquid: 69495,
    app_balance: 44495,
    fuel_liters: 14.43,
    fuel_cost: 20924,
    pocket_net: 48571,
    pocket_net_per_hour: 6071,
    pocket_net_per_km: 249,
    avg_speed_kmh: 24.4,
    notes: 'Jornada nocturna',
    is_deleted: false,
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    shift_date: '2026-08-17',
    gross_earnings: 95000,
    cash_collected: 30000,
    hours: 9.2,
    distance_km: 230,
    fuel_consumption: 7.8,
    gas_price_per_liter: 1450,
    sii_tax_rate: 0.1525,
    sii_tax_amount: 14488,
    app_liquid: 80512,
    app_balance: 50512,
    fuel_liters: 17.94,
    fuel_cost: 26013,
    pocket_net: 54499,
    pocket_net_per_hour: 5924,
    pocket_net_per_km: 237,
    avg_speed_kmh: 25.0,
    notes: 'Tráfico alto en hora punta',
    is_deleted: false,
  },
];

export default function HistoryScreen() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<DailyShift[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editingShift, setEditingShift] = useState<DailyShift | null>(null);
  const [editGrossStr, setEditGrossStr] = useState('');
  const [editCashStr, setEditCashStr] = useState('');
  const [editHoursStr, setEditHoursStr] = useState('');
  const [editKmStr, setEditKmStr] = useState('');
  const [editConsumptionStr, setEditConsumptionStr] = useState('');
  const [editGasPriceStr, setEditGasPriceStr] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      if (!user) {
        setShifts(DEMO_HISTORY);
        return;
      }

      const { data, error } = await supabase
        .from('daily_shifts')
        .select('*')
        .eq('user_id', user.id)
        .order('shift_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setShifts(data as DailyShift[]);
      } else {
        setShifts(DEMO_HISTORY);
      }
    } catch (e) {
      console.warn('Error loading history:', e);
      setShifts(DEMO_HISTORY);
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Filtered shifts based on activeTab (Active vs Trash)
  const displayedShifts = shifts.filter((s) =>
    activeTab === 'trash' ? s.is_deleted === true : !s.is_deleted
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Move to Trash (Soft Delete)
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
      Alert.alert('Papelera', 'El turno ha sido movido a la Papelera');
    } catch (e) {
      Alert.alert('Error', 'No se pudo mover el registro a la papelera');
    }
  };

  // Restore from Trash
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
      Alert.alert('Restaurado', 'El turno se ha restaurado a tus registros activos');
    } catch (e) {
      Alert.alert('Error', 'No se pudo restaurar el registro');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = (shiftId: string) => {
    Alert.alert(
      'Eliminar Definitivamente',
      '¿Deseas eliminar permanentemente este registro? Esta acción no se puede deshacer.',
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
              Alert.alert('Error', 'No se pudo eliminar el registro');
            }
          },
        },
      ]
    );
  };

  // Start Editing Shift
  const handleOpenEditModal = (shift: DailyShift) => {
    setEditingShift(shift);
    setEditGrossStr(shift.gross_earnings.toString());
    setEditCashStr(shift.cash_collected.toString());
    setEditHoursStr(shift.hours.toString());
    setEditKmStr(shift.distance_km.toString());
    setEditConsumptionStr(shift.fuel_consumption.toString());
    setEditGasPriceStr(shift.gas_price_per_liter.toString());
  };

  // Save Edit Shift
  const handleSaveEdit = async () => {
    if (!editingShift) return;

    setSavingEdit(true);
    try {
      const gross = parseFloat(editGrossStr) || 0;
      const cash = parseFloat(editCashStr) || 0;
      const hours = parseFloat(editHoursStr) || 0;
      const distanceKm = parseFloat(editKmStr) || 0;
      const fuelConsumption = parseFloat(editConsumptionStr) || 7.4;
      const gasPrice = parseFloat(editGasPriceStr) || 1450;

      const input: ShiftInput = {
        grossEarnings: gross,
        cashCollected: cash,
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
        cash_collected: cash,
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
      Alert.alert('Actualizado', 'Los datos del turno se han modificado correctamente.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar la modificación.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Export to CSV helper
  const exportToCSV = () => {
    const activeShifts = shifts.filter((s) => !s.is_deleted);
    if (activeShifts.length === 0) {
      Alert.alert('Exportar', 'No hay registros activos para exportar');
      return;
    }

    const headers = [
      'Fecha',
      'Bruto CLP',
      'Efectivo Cobrado',
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
      s.cash_collected,
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
          <Text style={styles.title}>Historial de Registros</Text>
          <Text style={styles.subtitle}>{shifts.filter((s) => !s.is_deleted).length} turnos guardados</Text>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV} activeOpacity={0.8}>
          <Ionicons name="download-outline" size={15} color="#F8FAFC" />
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
            Turnos Activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSelectorButton, activeTab === 'trash' && styles.tabSelectorActiveTrash]}
          onPress={() => setActiveTab('trash')}
        >
          <Ionicons name="trash-outline" size={14} color={activeTab === 'trash' ? '#EF4444' : '#64748B'} style={{ marginRight: 4 }} />
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
            tintColor="#10B981"
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'trash' ? 'La papelera está vacía.' : 'No hay turnos registrados.'}
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
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* Collapsible details breakdown */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <View style={styles.divider} />

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Ganancia Bruta App:</Text>
                      <Text style={styles.detailValue}>{formatCLP(item.gross_earnings)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Efectivo Cobrado en Mano:</Text>
                      <Text style={styles.detailValue}>{formatCLP(item.cash_collected)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Saldo App Transferible:</Text>
                      <Text style={[styles.detailValue, { color: '#3B82F6' }]}>
                        {formatCLP(item.app_balance)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Retención SII (15.25%):</Text>
                      <Text style={[styles.detailValue, { color: '#F59E0B' }]}>
                        -{formatCLP(item.sii_tax_amount)}
                      </Text>
                    </View>

                    {/* Daily Mileage & Consumption */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Kilómetros Recorridos (Día):</Text>
                      <Text style={[styles.detailValue, { color: '#F8FAFC' }]}>
                        {item.distance_km} km
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Consumo Tablero (Día):</Text>
                      <Text style={[styles.detailValue, { color: '#F8FAFC' }]}>
                        {item.fuel_consumption} L/100km
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Combustible Gastado ({item.fuel_liters} L):</Text>
                      <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                        -{formatCLP(item.fuel_cost)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tiempo Conectado:</Text>
                      <Text style={styles.detailValue}>
                        {formatHoursDecimal(item.hours)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rendimiento Real:</Text>
                      <Text style={[styles.detailValue, { color: '#10B981' }]}>
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
                          <Ionicons name="create-outline" size={15} color="#3B82F6" />
                          <Text style={styles.editButtonText}>Modificar Día</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.trashButton}
                          onPress={() => handleMoveToTrash(item.id)}
                        >
                          <Ionicons name="trash-outline" size={15} color="#EF4444" />
                          <Text style={styles.trashButtonText}>Mover a Papelera</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.restoreButton}
                          onPress={() => handleRestoreFromTrash(item.id)}
                        >
                          <Ionicons name="refresh-outline" size={15} color="#10B981" />
                          <Text style={styles.restoreButtonText}>Restaurar Turno</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.permanentDeleteButton}
                          onPress={() => handlePermanentDelete(item.id)}
                        >
                          <Ionicons name="close-circle-outline" size={15} color="#EF4444" />
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
      <Modal visible={!!editingShift} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Modificar Turno - {editingShift?.shift_date}
              </Text>
              <TouchableOpacity onPress={() => setEditingShift(null)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ganancia Bruta ($ CLP)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editGrossStr}
                  onChangeText={setEditGrossStr}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Efectivo Cobrado ($ CLP)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editCashStr}
                  onChangeText={setEditCashStr}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Horas Conectado Total (Decimal ex: 7.5)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editHoursStr}
                  onChangeText={setEditHoursStr}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Editable Daily Mileage & Fuel Consumption */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kilómetros Recorridos en el Día (km)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editKmStr}
                  onChangeText={setEditKmStr}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Consumo Promedio del Día (L/100km)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editConsumptionStr}
                  onChangeText={setEditConsumptionStr}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio Bencina ($/Litro)</Text>
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
    backgroundColor: '#0B0F17',
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
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: '#161E2E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#243044',
  },
  exportButtonText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 12,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#161E2E',
    borderRadius: 10,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#243044',
  },
  tabSelectorButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabSelectorActive: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#10B98144',
  },
  tabSelectorActiveTrash: {
    backgroundColor: '#0B0F17',
    borderWidth: 1,
    borderColor: '#EF444444',
  },
  tabSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabSelectorTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  tabSelectorTextTrash: {
    color: '#EF4444',
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
    color: '#64748B',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#161E2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243044',
    overflow: 'hidden',
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
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subDateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pocketBlock: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  pocketNetValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#10B981',
  },
  pocketNetLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#243044',
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
    color: '#94A3B8',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  notesBox: {
    backgroundColor: '#0B0F17',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#CBD5E1',
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
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F633',
  },
  editButtonText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '700',
  },
  trashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF444433',
  },
  trashButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B98133',
  },
  restoreButtonText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  permanentDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF444455',
  },
  permanentDeleteButtonText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#161E2E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: '#243044',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243044',
    color: '#F8FAFC',
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
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0B0F17',
  },
  modalCancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  modalSaveText: {
    color: '#0B0F17',
    fontSize: 13,
    fontWeight: '700',
  },
});
