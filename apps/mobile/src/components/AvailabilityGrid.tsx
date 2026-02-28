import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

interface Slot {
  date: string;
  dayLabel: string;
  times: string[];
}

interface Props {
  availability?: Record<string, string>;
  onSelect: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

const DAYS: Array<{ key: string; label: string }> = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
];

function parseRange(range: string): string[] {
  // "9:00-17:00" → ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM"]
  const [startStr, endStr] = range.split('-');
  const [sh, sm] = startStr.split(':').map(Number);
  const [eh] = endStr.split(':').map(Number);
  const slots: string[] = [];
  for (let h = sh; h < eh - 1; h += 2) {
    const period = h < 12 ? 'AM' : 'PM';
    const display = h === 12 ? 12 : h % 12 || 12;
    slots.push(`${display}:${sm === 0 ? '00' : sm} ${period}`);
  }
  return slots.slice(0, 4);
}

function getNextOccurrence(dayKey: string): Date {
  const dayIndex = DAYS.findIndex(d => d.key === dayKey);
  const today = new Date();
  const todayDay = (today.getDay() + 6) % 7; // Mon=0
  let diff = dayIndex - todayDay;
  if (diff <= 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Demo slots when no availability data is present
function getDemoSlots(): Slot[] {
  return DAYS.slice(0, 4).map((day, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return {
      date: d.toISOString().split('T')[0],
      dayLabel: day.label,
      times: ['9:00 AM', '11:00 AM', '2:00 PM'],
    };
  });
}

export default function AvailabilityGrid({ availability, onSelect, selectedDate, selectedTime }: Props) {
  const slots: Slot[] = availability
    ? DAYS.filter(d => availability[d.key])
        .map(d => {
          const date = getNextOccurrence(d.key);
          return {
            date: date.toISOString().split('T')[0],
            dayLabel: `${d.label} ${formatDate(date)}`,
            times: parseRange(availability[d.key]!),
          };
        })
        .slice(0, 5)
    : getDemoSlots();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.grid}>
        {slots.map(slot => (
          <View key={slot.date} style={styles.column}>
            <Text style={styles.dayLabel}>{slot.dayLabel}</Text>
            {slot.times.map(time => {
              const isSelected = selectedDate === slot.date && selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.slot, isSelected && styles.slotSelected]}
                  onPress={() => onSelect(slot.date, time)}
                >
                  <Text style={[styles.slotText, isSelected && styles.slotTextSelected]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginHorizontal: -16 },
  grid: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 4 },
  column: { width: 88 },
  dayLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' },
  slot: { paddingVertical: 9, paddingHorizontal: 6, borderRadius: 8, backgroundColor: '#f1f5f9', marginBottom: 6, alignItems: 'center' },
  slotSelected: { backgroundColor: '#F5BE00' },
  slotText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  slotTextSelected: { color: '#0f172a' },
});
