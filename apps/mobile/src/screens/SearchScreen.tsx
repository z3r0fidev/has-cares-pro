import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { Search as SearchIcon, MapPin, Star } from 'lucide-react-native';

const API_URL = 'http://10.0.0.157:3001'; // Default prototype IP

export default function SearchScreen({ navigation }: any) {
  const [zip, setZip] = useState('');
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Prototype coordinates
      const res = await fetch(`${API_URL}/providers?lat=39.9926&lon=-75.1652&radius=50`);
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Profile', { id: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.imagePlaceholder}>
          {item.profile_image_url ? (
            <Image source={{ uri: item.profile_image_url }} style={styles.image} />
          ) : (
            <Text style={styles.initials}>{item.name?.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.specialty}>{item.specialties?.join(', ')}</Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.location}>
          <MapPin size={14} color="#64748b" />
          <Text style={styles.locationText}>{item.address?.city}, {item.address?.state}</Text>
        </View>
        <View style={styles.tier}>
          <Text style={styles.tierText}>Tier {item.verification_tier} Verified</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Enter ZIP Code"
          value={zip}
          onChangeText={setZip}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleSearch}>
          <SearchIcon color="#fff" size={20} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={providers}
          renderItem={renderItem}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Enter a ZIP to find providers nearby.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBox: { padding: 20, flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  input: { flex: 1, height: 45, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#fff' },
  button: { width: 45, height: 45, backgroundColor: '#2563eb', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  imagePlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  initials: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
  headerText: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  specialty: { fontSize: 14, color: '#64748b' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12, color: '#64748b' },
  tier: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  tierText: { fontSize: 10, fontWeight: 'bold', color: '#166534' },
  empty: { textAlign: 'center', marginTop: 40, color: '#94a3b8' }
});
