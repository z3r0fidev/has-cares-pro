import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';

const TIER_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Verified', color: '#1d4ed8', bg: '#dbeafe' },
  2: { label: 'Identity Verified', color: '#1d4ed8', bg: '#dbeafe' },
  3: { label: 'Practice Verified', color: '#15803d', bg: '#dcfce7' },
};

interface Props {
  tier: number;
  size?: 'sm' | 'md';
}

export default function VerificationBadge({ tier, size = 'md' }: Props) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG[1];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.sm]}>
      <ShieldCheck size={isSmall ? 10 : 14} color={config.color} />
      {!isSmall && <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  label: { fontSize: 11, fontWeight: '700' },
});
