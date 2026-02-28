import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = '🔍', title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
