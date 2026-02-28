import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import StarRating from './StarRating';

interface Review {
  id: string;
  rating_total: number;
  content: string;
  status: string;
  created_at: string;
}

export default function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <StarRating rating={review.rating_total} size={13} />
        <Text style={styles.date}>
          {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Text style={styles.content}>{review.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 11, color: '#94a3b8' },
  content: { fontSize: 14, color: '#334155', lineHeight: 20 },
});
