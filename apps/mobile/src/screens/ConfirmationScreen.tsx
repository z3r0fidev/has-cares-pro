import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { scheduleBookingConfirmation } from '../lib/notifications';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'Confirmation'>;

type Params = {
  providerName: string;
  date: string;
  reason: string;
};

export default function ConfirmationScreen({
  navigation,
  route,
}: {
  navigation: NavProp;
  route: { params: Params };
}) {
  const { providerName, date, reason } = route.params;

  useEffect(() => {
    scheduleBookingConfirmation(providerName, date);
  }, []);

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <CheckCircle size={72} color="#16a34a" style={styles.icon} />
      <Text style={styles.title}>Appointment Requested</Text>
      <Text style={styles.subtitle}>
        Your request has been submitted. The physician's office will contact you to confirm.
      </Text>

      <View style={styles.card}>
        <Row label="Physician" value={providerName} />
        <Row label="Requested date" value={formattedDate} />
        <Row label="Reason" value={reason} />
      </View>

      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={() => navigation.navigate('CareTeam')}
      >
        <Text style={styles.btnPrimaryText}>View My Care Team</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => navigation.navigate('Search')}
      >
        <Text style={styles.btnSecondaryText}>Back to Search</Text>
      </TouchableOpacity>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 30, alignItems: 'center', justifyContent: 'center' },
  icon: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  card: { width: '100%', backgroundColor: '#f8fafc', borderRadius: 14, padding: 20, marginBottom: 28 },
  row: { marginBottom: 14 },
  rowLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  rowValue: { fontSize: 15, color: '#334155', fontWeight: '500' },
  btnPrimary: { width: '100%', backgroundColor: '#F5BE00', borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  btnSecondary: { width: '100%', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
});
