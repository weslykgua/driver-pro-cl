import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

interface MiniDatePickerProps {
  visible: boolean;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onClose: () => void;
}

export const MiniDatePicker: React.FC<MiniDatePickerProps> = ({
  visible,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const initialDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());

  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    daysGrid.push(day);
  }

  const formatMonthDay = (day: number) => {
    const m = (currentMonth + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${currentYear}-${m}-${d}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.calendarCard} activeOpacity={1}>
          {/* Header Month / Year controls */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {monthsEs[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Days of Week Header */}
          <View style={styles.daysOfWeekRow}>
            {daysOfWeek.map((day, index) => (
              <Text key={index} style={styles.dayOfWeekText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.grid}>
            {daysGrid.map((day, index) => {
              if (day === null) {
                return <View key={index} style={styles.dayCellEmpty} />;
              }

              const formattedDate = formatMonthDay(day);
              const isSelected = selectedDate === formattedDate;
              const isToday =
                new Date().toISOString().split('T')[0] === formattedDate;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => {
                    onSelectDate(formattedDate);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Action */}
          <TouchableOpacity
            style={styles.todayButton}
            onPress={() => {
              const today = new Date().toISOString().split('T')[0];
              onSelectDate(today);
              onClose();
            }}
          >
            <Text style={styles.todayButtonText}>Seleccionar Hoy</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 32, 51, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  dayOfWeekText: {
    width: 38,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: 42,
    height: 40,
  },
  dayCell: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dayTextToday: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  todayButton: {
    marginTop: 16,
    backgroundColor: COLORS.neutralSoft,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  todayButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
