import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LogOut } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Provider } from '@careequity/core';
import { AppStackParamList } from '../types/navigation';
import { apiFetch } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import AppointmentCard from '../components/AppointmentCard';
import SavedProviderCard from '../components/SavedProviderCard';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'CareTeam'>;

interface SavedEntry { id: string; provider: Provider }
interface Appointment {
  id: string;
  provider: Provider;
  appointment_date: string;
  status: string;
  reason?: string;
}

export default function CareTeamScreen({ navigation }: { navigation: NavProp }) {
  const { token, logout } = useAuth();
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Header logout button
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ paddingRight: 4 }}>
          <LogOut size={22} color="#0f172a" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [savedRes, apptRes] = await Promise.all([
        apiFetch('/booking/saved', {}, token),
        apiFetch('/booking/my-appointments', {}, token),
      ]);
      if (savedRes.ok) setSaved(await savedRes.json());
      if (apptRes.ok) setAppointments(await apptRes.json());
    } catch {
      Alert.alert('Error', 'Could not load your care team.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = async () => {
    await logout();
  };

  const handleCancel = async (apptId: string) => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(apptId);
            try {
              const res = await apiFetch(`/booking/appointment/${apptId}/cancel`, { method: 'PATCH' }, token);
              if (res.ok) {
                setAppointments(prev =>
                  prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a),
                );
              }
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  if (loading) return <LoadingSpinner />;

  const sections = [
    {
      title: '❤️  Saved Physicians',
      data: saved.length > 0 ? saved : [null],
      isEmpty: saved.length === 0,
    },
    {
      title: '📅  Appointments',
      data: appointments.length > 0 ? appointments : [null],
      isEmpty: appointments.length === 0,
    },
  ];

  return (
    <SectionList
      style={styles.list}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchData(); }}
          tintColor="#F5BE00"
        />
      }
      sections={sections}
      keyExtractor={(item, index) => (item ? (item as SavedEntry | Appointment).id : `empty-${index}`)}
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionHeader}>{section.title}</Text>
      )}
      renderItem={({ item, section }) => {
        if (!item) {
          return (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>
                {section.title.includes('Saved')
                  ? 'No saved physicians yet.'
                  : 'No upcoming appointments.'}
              </Text>
              {section.title.includes('Saved') && (
                <TouchableOpacity onPress={() => navigation.navigate('Search')}>
                  <Text style={styles.findLink}>Find a Physician →</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }

        if (section.title.includes('Saved')) {
          const entry = item as SavedEntry;
          return (
            <SavedProviderCard
              provider={entry.provider}
              onPress={() => navigation.navigate('Profile', { id: entry.provider.id })}
            />
          );
        }

        const appt = item as Appointment;
        return (
          <AppointmentCard
            appointment={appt}
            onCancel={handleCancel}
            cancelling={cancellingId === appt.id}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 40 },
  sectionHeader: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10, marginTop: 16 },
  emptySection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginBottom: 8 },
  findLink: { fontSize: 14, fontWeight: '700', color: '#ca8a04' },
});
