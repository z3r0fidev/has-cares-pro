import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Video } from 'lucide-react-native';
import { Provider } from '@careequity/core';
import VerificationBadge from './VerificationBadge';
import StarRating from './StarRating';

interface Props {
  provider: Provider & { rating?: number; reviewCount?: number; distance?: number };
  onPress: () => void;
}

export default function ProviderCard({ provider, onPress }: Props) {
  const initial = provider.name.charAt(0).toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          {provider.profile_image_url ? (
            <Image source={{ uri: provider.profile_image_url }} style={styles.image} />
          ) : (
            <Text style={styles.initial}>{initial}</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{provider.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{provider.specialties?.join(', ')}</Text>

          {provider.rating !== undefined && (
            <View style={{ marginTop: 4 }}>
              <StarRating rating={provider.rating} count={provider.reviewCount} size={13} />
            </View>
          )}

          <View style={styles.meta}>
            <MapPin size={12} color="#64748b" />
            <Text style={styles.metaText}>
              {provider.address?.city}, {provider.address?.state}
              {provider.distance !== undefined ? `  ·  ${provider.distance.toFixed(1)} mi` : ''}
            </Text>
          </View>

          {/* Tags row */}
          <View style={styles.tagsRow}>
            <VerificationBadge tier={provider.verification_tier} size="sm" />
            {provider.telehealth_url ? (
              <View style={styles.telehealthBadge}>
                <Video size={10} color="#1d4ed8" />
                <Text style={styles.telehealthText}>Telehealth</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Identity tags */}
      {provider.identity_tags?.length > 0 && (
        <View style={styles.identityRow}>
          {provider.identity_tags.slice(0, 3).map(tag => (
            <View key={tag} style={styles.identityTag}>
              <Text style={styles.identityTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', gap: 14 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  image: { width: '100%', height: '100%' },
  initial: { fontSize: 22, fontWeight: '800', color: '#64748b' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  specialty: { fontSize: 13, color: '#64748b', marginTop: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 12, color: '#64748b' },
  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  telehealthBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#dbeafe', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 20 },
  telehealthText: { fontSize: 10, fontWeight: '700', color: '#1d4ed8' },
  identityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  identityTag: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  identityTagText: { fontSize: 10, fontWeight: '700', color: '#92400e' },
});
