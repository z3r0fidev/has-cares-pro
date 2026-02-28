import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

interface Appointment {
  id: string;
  provider: { name: string };
  appointment_date: string;
  status: string;
  reason?: string;
}

interface Props {
  appointment: Appointment;
  onCancel: (id: string) => void;
  cancelling: boolean;
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#fef9c3', color: '#92400e' },
  confirmed: { bg: '#dcfce7', color: '#15803d' },
  cancelled: { bg: '#f1f5f9', color: '#94a3b8' },
  completed: { bg: '#dbeafe', color: '#1e40af' },
};

export default function AppointmentCard({ appointment, onCancel, cancelling }: Props) {
  const style = STATUS_STYLE[appointment.status] ?? STATUS_STYLE.pending;
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';

  const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.provider}>with {appointment.provider?.name}</Text>
          {appointment.reason ? <Text style={styles.reason}>{appointment.reason}</Text> : null}
        </View>
        <View style={[styles.badge, { backgroundColor: style.bg }]}>
          <Text style={[styles.badgeText, { color: style.color }]}>{appointment.status}</Text>
        </View>
      </View>
      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => onCancel(appointment.id)}
          disabled={cancelling}
        >
          {cancelling
            ? <ActivityIndicator size="small" color="#ef4444" />
            : <Text style={styles.cancelText}>Cancel Appointment</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  info: { flex: 1 },
  date: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  provider: { fontSize: 13, color: '#64748b', marginTop: 3 },
  reason: { fontSize: 12, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cancelBtn: { marginTop: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
});
