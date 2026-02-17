import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, Heart, MapPin, Globe } from 'lucide-react-native';
import { Provider } from '@careequity/core';

const API_URL = 'http://10.0.0.157:3001';

export default function ProfileScreen({ route }: { route: { params: { id: string } } }) {
  const { id } = route.params;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/providers/${id}`)
      .then(res => res.json())
      .then(data => {
        setProvider(data);
        setLoading(false);
      })
      .catch(console.error);
  }, [id]);

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;
  if (!provider) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Provider not found</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.imageContainer}>
          {provider.profile_image_url ? (
            <Image source={{ uri: provider.profile_image_url }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.initials}>{provider.name?.charAt(0)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{provider.name}</Text>
        <Text style={styles.specialty}>{provider.specialties?.join(', ')}</Text>
        
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart color="#64748b" size={20} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
            <Calendar color="#fff" size={20} />
            <Text style={[styles.actionText, { color: '#fff' }]}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Practice Information</Text>
        <View style={styles.infoRow}>
          <MapPin size={20} color="#64748b" />
          <Text style={styles.infoText}>
            {provider.address?.street}, {provider.address?.city}, {provider.address?.state} {provider.address?.zip}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Globe size={20} color="#64748b" />
          <Text style={styles.infoText}>{provider.languages?.join(', ')}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Verification Status</Text>
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>Tier {provider.verification_tier} Verified Physician</Text>
        </View>
        <Text style={styles.tierDesc}>
          This physician has been verified by our clinical audit team for their credentials and practice history.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 30, alignItems: 'center', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  imageContainer: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 40, fontWeight: 'bold', color: '#64748b' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  specialty: { fontSize: 16, color: '#64748b', marginTop: 4, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 15, marginTop: 25 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' },
  primaryButton: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  actionText: { fontWeight: 'bold', color: '#64748b' },
  section: { padding: 25, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 15 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 15, alignItems: 'center' },
  infoText: { fontSize: 15, color: '#334155', flex: 1 },
  tierBadge: { backgroundColor: '#dcfce7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginBottom: 10 },
  tierText: { color: '#166534', fontWeight: 'bold', fontSize: 14 },
  tierDesc: { fontSize: 13, color: '#64748b', lineHeight: 20 }
});
