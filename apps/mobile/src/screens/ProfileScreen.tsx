import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Calendar, Heart, HeartOff, MapPin, Globe, Video, Phone } from 'lucide-react-native';
import { Provider } from '@careequity/core';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../types/navigation';
import { apiFetch } from '../lib/apiClient';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import VerificationBadge from '../components/VerificationBadge';
import StarRating from '../components/StarRating';
import AvailabilityGrid from '../components/AvailabilityGrid';
import ReviewCard from '../components/ReviewCard';
import ReviewForm from '../components/ReviewForm';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'Profile'>;

interface Review {
  id: string;
  rating_total: number;
  content: string;
  status: string;
  created_at: string;
}

export default function ProfileScreen({
  navigation,
  route,
}: {
  navigation: NavProp;
  route: { params: { id: string } };
}) {
  const { id } = route.params;
  const { token } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | undefined>();

  useEffect(() => {
    Promise.all([
      apiFetch(`/providers/${id}`).then(r => r.json()),
      apiFetch(`/providers/${id}/reviews`).then(r => r.json()),
    ])
      .then(([p, r]) => {
        setProvider(p);
        setReviews(Array.isArray(r) ? r.filter((rv: Review) => rv.status === 'published') : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleSave = async () => {
    if (!token) { Alert.alert('Sign in required', 'Log in to save providers.'); return; }
    setSavingToggle(true);
    try {
      const res = await apiFetch(`/booking/save/${id}`, { method: 'POST' }, token);
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      }
    } catch {
      Alert.alert('Error', 'Could not update saved status.');
    } finally {
      setSavingToggle(false);
    }
  };

  const handleBook = () => {
    if (!provider) return;
    navigation.navigate('Booking', {
      providerId: id,
      providerName: provider.name,
      availability: provider.availability as Record<string, string> | undefined,
    });
  };

  const handleReviewSubmit = async (rating: number, content: string) => {
    const res = await apiFetch(
      `/providers/${id}/reviews`,
      { method: 'POST', body: JSON.stringify({ rating_total: rating, content }) },
    );
    if (!res.ok) throw new Error('Review submission failed');
  };

  if (loading || !provider) return <LoadingSpinner />;

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating_total, 0) / reviews.length
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatarWrap}>
          {provider.profile_image_url ? (
            <Image source={{ uri: provider.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{provider.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{provider.name}{provider.credentials?.length ? `, ${provider.credentials.join(', ')}` : ''}</Text>
        <Text style={styles.specialty}>{provider.specialties?.join(', ')}</Text>

        {avgRating !== undefined && (
          <View style={{ marginTop: 8 }}>
            <StarRating rating={avgRating} count={reviews.length} size={16} />
          </View>
        )}

        <View style={styles.badgeRow}>
          <VerificationBadge tier={provider.verification_tier} />
          {provider.telehealth_url ? (
            <View style={styles.telehealthBadge}>
              <Video size={12} color="#1d4ed8" />
              <Text style={styles.telehealthText}>Telehealth Available</Text>
            </View>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionSave}
            onPress={handleToggleSave}
            disabled={savingToggle}
          >
            {saved
              ? <HeartOff size={18} color="#ef4444" />
              : <Heart size={18} color="#64748b" />
            }
            <Text style={styles.actionSaveText}>{saved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBook} onPress={handleBook}>
            <Calendar size={18} color="#0f172a" />
            <Text style={styles.actionBookText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      {provider.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{provider.bio}</Text>
        </View>
      ) : null}

      {/* Practice Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Practice Information</Text>
        {provider.address && (
          <View style={styles.infoRow}>
            <MapPin size={16} color="#64748b" />
            <Text style={styles.infoText}>
              {provider.address.street}, {provider.address.city}, {provider.address.state} {provider.address.zip}
            </Text>
          </View>
        )}
        {provider.languages?.length > 0 && (
          <View style={styles.infoRow}>
            <Globe size={16} color="#64748b" />
            <Text style={styles.infoText}>Languages: {provider.languages.join(', ')}</Text>
          </View>
        )}
        {provider.insurance && (
          <View style={styles.infoRow}>
            <Phone size={16} color="#64748b" />
            <Text style={styles.infoText}>Insurance: {provider.insurance}</Text>
          </View>
        )}
      </View>

      {/* Cultural competency tags */}
      {provider.identity_tags?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cultural Competency</Text>
          <View style={styles.tagRow}>
            {provider.identity_tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Times</Text>
        <AvailabilityGrid
          availability={provider.availability as Record<string, string> | undefined}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onSelect={(date, time) => {
            setSelectedDate(date);
            setSelectedTime(time);
          }}
        />
        {selectedDate && selectedTime && (
          <TouchableOpacity style={styles.bookSlotBtn} onPress={handleBook}>
            <Text style={styles.bookSlotText}>Book {selectedTime} · {selectedDate}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Reviews ({reviews.length})</Text>
        {reviews.length === 0 && (
          <Text style={styles.noReviews}>No reviews yet. Be the first!</Text>
        )}
        {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
      </View>

      {/* Leave a review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leave a Review</Text>
        <ReviewForm onSubmit={handleReviewSubmit} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { paddingBottom: 40 },
  hero: { padding: 24, alignItems: 'center', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  avatarWrap: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', backgroundColor: '#f1f5f9', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 42, fontWeight: '800', color: '#64748b' },
  name: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  specialty: { fontSize: 15, color: '#64748b', marginTop: 4, textAlign: 'center' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  telehealthBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dbeafe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  telehealthText: { fontSize: 12, fontWeight: '700', color: '#1d4ed8' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  actionSave: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  actionSaveText: { fontWeight: '700', color: '#64748b' },
  actionBook: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5BE00' },
  actionBookText: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  bio: { fontSize: 15, color: '#334155', lineHeight: 24 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { fontSize: 14, color: '#334155', flex: 1, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  bookSlotBtn: { marginTop: 14, backgroundColor: '#F5BE00', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  bookSlotText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  noReviews: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic' },
});
