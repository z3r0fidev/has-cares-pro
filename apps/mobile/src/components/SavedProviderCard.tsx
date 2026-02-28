import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Provider } from '@careequity/core';

interface Props {
  provider: Provider;
  onPress: () => void;
}

export default function SavedProviderCard({ provider, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        {provider.profile_image_url ? (
          <Image source={{ uri: provider.profile_image_url }} style={styles.image} />
        ) : (
          <Text style={styles.initial}>{provider.name.charAt(0)}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
        <Text style={styles.specialty} numberOfLines={1}>{provider.specialties?.join(', ')}</Text>
        {provider.address && (
          <View style={styles.location}>
            <MapPin size={11} stroke="#94a3b8" />
            <Text style={styles.locationText}>{provider.address.city}, {provider.address.state}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  image: { width: '100%', height: '100%' },
  initial: { fontSize: 18, fontWeight: '800', color: '#64748b' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  specialty: { fontSize: 12, color: '#64748b', marginTop: 2 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  locationText: { fontSize: 11, color: '#94a3b8' },
});
