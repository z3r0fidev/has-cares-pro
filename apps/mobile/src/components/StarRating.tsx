import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';

interface Props {
  rating: number;
  count?: number;
  size?: number;
}

export default function StarRating({ rating, count, size = 16 }: Props) {
  const clampedRating = Math.min(5, Math.max(0, rating));
  const fillPercent = (clampedRating / 5) * 100;

  return (
    <View style={styles.row}>
      <View style={styles.starsContainer}>
        {/* Gray background stars */}
        <View style={styles.starsRow}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={size} stroke="#94a3b8" fill="#e2e8f0" />
          ))}
        </View>
        {/* Amber overlay stars, clipped by width */}
        <View style={[styles.starsRow, styles.overlay, { width: `${fillPercent}%` }]}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={size} stroke="#F59E0B" fill="#F59E0B" />
          ))}
        </View>
      </View>
      <Text style={[styles.score, { fontSize: size - 2 }]}>{clampedRating.toFixed(1)}</Text>
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 3 }]}>({count})</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starsContainer: { position: 'relative' },
  starsRow: { flexDirection: 'row' },
  overlay: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  score: { fontWeight: '700', color: '#0f172a' },
  count: { color: '#64748b' },
});
