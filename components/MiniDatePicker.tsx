import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  // Generate matrix of days for the current month view
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
              <Ionicons name="chevron-back" size={20} color="#F8FAFC" />
            </TouchableOpacity>

            <Text style={styles.monthYearText}>
              {monthsEs[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color="#F8FAFC" />
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
          <TouchableOpacity style={styles.todayButton} onPress={() => {
            const today = new Date().toISOString().split('T')[0];
            onSelectDate(today);
            onClose();
          }}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarCard: {
    backgroundColor: '#161E2E',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#243044',
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
    borderRadius: 8,
    backgroundColor: '#0B0F17',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#243044',
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
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
    fontWeight: '700',
    color: '#64748B',
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
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#10B981',
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  dayTextSelected: {
    color: '#0B0F17',
    fontWeight: '800',
  },
  dayTextToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  todayButton: {
    marginTop: 16,
    backgroundColor: '#0B0F17',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243044',
  },
  todayButtonText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
});
