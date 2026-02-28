import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Star } from 'lucide-react-native';

interface Props {
  onSubmit: (rating: number, content: string) => Promise<void>;
}

export default function ReviewForm({ onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || !content.trim()) return;
    setLoading(true);
    try {
      await onSubmit(rating, content.trim());
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.successBox}>
        <Text style={styles.successText}>✓ Review submitted for moderation. Thank you!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Your Rating</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
            <Star
              size={28}
              color={n <= rating ? '#F59E0B' : '#cbd5e1'}
              fill={n <= rating ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Your Review</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Share your experience with this physician..."
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.btn, (rating === 0 || !content.trim() || loading) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={rating === 0 || !content.trim() || loading}
      >
        {loading
          ? <ActivityIndicator color="#0f172a" />
          : <Text style={styles.btnText}>Submit Review</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  textarea: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#334155', minHeight: 90, marginBottom: 12 },
  btn: { backgroundColor: '#F5BE00', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  successBox: { backgroundColor: '#dcfce7', borderRadius: 10, padding: 14, alignItems: 'center' },
  successText: { fontSize: 14, fontWeight: '600', color: '#15803d' },
});
