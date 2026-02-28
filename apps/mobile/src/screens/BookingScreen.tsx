import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Calendar } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { apiFetch } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import AvailabilityGrid from '../components/AvailabilityGrid';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'Booking'>;

type Params = {
  providerId: string;
  providerName: string;
  availability?: Record<string, string>;
};

export default function BookingScreen({
  navigation,
  route,
}: {
  navigation: NavProp;
  route: { params: Params };
}) {
  const { providerId, providerName, availability } = route.params;
  const { token } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const buildDatetime = (): string => {
    if (!selectedDate || !selectedTime) return '';
    // Parse "9:00 AM" into 24h
    const [timePart, period] = selectedTime.split(' ');
    const [hStr, mStr] = timePart.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${selectedDate}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  };

  const handleBook = async () => {
    if (!token) { Alert.alert('Sign in required', 'Log in to book an appointment.'); return; }
    if (!selectedDate || !selectedTime) { Alert.alert('Select a time', 'Please choose an available time slot.'); return; }
    if (!reason.trim()) { Alert.alert('Reason required', 'Please describe the reason for your visit.'); return; }

    setLoading(true);
    try {
      const res = await apiFetch(
        '/booking/appointment',
        {
          method: 'POST',
          body: JSON.stringify({ providerId, date: buildDatetime(), reason: reason.trim() }),
        },
        token,
      );
      if (res.ok) {
        navigation.replace('Confirmation', {
          providerName,
          date: buildDatetime(),
          reason: reason.trim(),
        });
      } else {
        Alert.alert('Booking Failed', 'Could not book appointment. Please try again.');
      }
    } catch {
      Alert.alert('Network Error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.providerName}>with {providerName}</Text>

        {/* Availability grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Time</Text>
          <AvailabilityGrid
            availability={availability}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelect={handleSlotSelect}
          />
        </View>

        {/* Selected slot summary */}
        {selectedDate && selectedTime && (
          <View style={styles.selectedBox}>
            <Calendar size={16} color="#ca8a04" />
            <Text style={styles.selectedText}>{selectedTime} · {selectedDate}</Text>
          </View>
        )}

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Visit</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe your symptoms or reason for this appointment..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleBook}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#0f172a" />
            : <Text style={styles.btnText}>Request Appointment</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  providerName: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  selectedBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde68a', borderRadius: 10, padding: 12, marginBottom: 24 },
  selectedText: { fontSize: 15, fontWeight: '700', color: '#92400e' },
  textarea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 14, fontSize: 15, color: '#334155', minHeight: 100 },
  btn: { backgroundColor: '#F5BE00', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
});
