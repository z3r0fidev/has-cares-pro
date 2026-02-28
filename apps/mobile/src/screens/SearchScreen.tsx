import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SlidersHorizontal, MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Provider } from '@careequity/core';
import { AppStackParamList } from '../types/navigation';
import { apiFetch } from '../lib/apiClient';
import { resolveZip } from '../lib/zipCoords';
import { TimedCache } from '../lib/storage';
import ProviderCard from '../components/ProviderCard';
import FilterSheet from '../components/FilterSheet';
import EmptyState from '../components/EmptyState';

type NavProp = NativeStackNavigationProp<AppStackParamList, 'Search'>;

interface FilterState {
  specialty: string;
  insurance: string;
  radius: number;
}

type ProviderWithExtras = Provider & { rating?: number; reviewCount?: number; distance?: number };

export default function SearchScreen({ navigation }: { navigation: NavProp }) {
  const [zip, setZip] = useState('');
  const [providers, setProviders] = useState<ProviderWithExtras[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ specialty: '', insurance: '', radius: 25 });

  // Header buttons: filter icon + care team icon
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={hdrStyles.row}>
          <TouchableOpacity onPress={() => navigation.navigate('CareTeam')} style={hdrStyles.btn}>
            <Text style={hdrStyles.careTeamText}>My Care</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFilterVisible(true)} style={hdrStyles.btn}>
            <SlidersHorizontal size={22} stroke="#0f172a" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const doSearch = useCallback(
    async (lat: number, lon: number, appliedFilters: FilterState) => {
      setLoading(true);
      setHasSearched(true);

      const cacheKey = `search:${lat.toFixed(3)},${lon.toFixed(3)},${appliedFilters.specialty},${appliedFilters.insurance},${appliedFilters.radius}`;
      const cached = await TimedCache.get<ProviderWithExtras[]>(cacheKey);
      if (cached) setProviders(cached); // show stale while refreshing

      try {
        const qs = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          radius: String(appliedFilters.radius),
          ...(appliedFilters.specialty && { specialty: appliedFilters.specialty }),
          ...(appliedFilters.insurance && { insurance: appliedFilters.insurance }),
        });
        const res = await apiFetch(`/providers?${qs}`);
        if (res.ok) {
          const data: ProviderWithExtras[] = await res.json();
          setProviders(data);
          await TimedCache.set(cacheKey, data);
        }
      } catch {
        if (!cached) Alert.alert('Network Error', 'Could not reach the server. Showing cached results if available.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleGpsSearch = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location Permission', 'Grant location access or enter a ZIP code to search.');
      return;
    }
    setLoading(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await doSearch(loc.coords.latitude, loc.coords.longitude, filters);
    } catch {
      Alert.alert('Location Error', 'Could not determine your location. Enter a ZIP code instead.');
      setLoading(false);
    }
  };

  const handleZipSearch = () => {
    const coords = resolveZip(zip);
    doSearch(coords.lat, coords.lon, filters);
  };

  const handleFilterApply = (newFilters: FilterState) => {
    setFilters(newFilters);
    if (hasSearched) {
      // Re-run last search with new filters
      const coords = resolveZip(zip);
      doSearch(coords.lat, coords.lon, newFilters);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="ZIP Code"
          value={zip}
          onChangeText={setZip}
          keyboardType="numeric"
          returnKeyType="search"
          onSubmitEditing={handleZipSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleZipSearch}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gpsBtn} onPress={handleGpsSearch}>
          <MapPin size={20} stroke="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {(filters.specialty || filters.insurance || filters.radius !== 25) && (
        <View style={styles.chipRow}>
          {filters.specialty ? <Chip label={filters.specialty} /> : null}
          {filters.insurance ? <Chip label={filters.insurance} /> : null}
          {filters.radius !== 25 ? <Chip label={`${filters.radius} mi`} /> : null}
        </View>
      )}

      {/* Results */}
      {loading && providers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#F5BE00" />
        </View>
      ) : (
        <FlatList
          data={providers}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProviderCard
              provider={item}
              onPress={() => navigation.navigate('Profile', { id: item.id })}
            />
          )}
          ListEmptyComponent={
            hasSearched ? (
              <EmptyState
                icon="🩺"
                title="No physicians found"
                subtitle="Try expanding your radius or adjusting your filters."
              />
            ) : (
              <EmptyState
                icon="📍"
                title="Find a doctor who gets you"
                subtitle="Enter your ZIP code or use GPS to search for nearby physicians."
              />
            )
          }
        />
      )}

      <FilterSheet
        visible={filterVisible}
        current={filters}
        onApply={handleFilterApply}
        onClose={() => setFilterVisible(false)}
      />
    </View>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.text} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: { flexDirection: 'row', gap: 8, padding: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  input: { flex: 1, height: 44, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, fontSize: 15, color: '#0f172a', backgroundColor: '#f8fafc' },
  searchBtn: { backgroundColor: '#F5BE00', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  searchBtnText: { fontWeight: '700', color: '#0f172a', fontSize: 14 },
  gpsBtn: { backgroundColor: '#f1f5f9', borderRadius: 10, width: 44, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingVertical: 10, flexWrap: 'wrap', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  list: { padding: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
});

const chipStyles = StyleSheet.create({
  chip: { backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  text: { fontSize: 12, fontWeight: '600', color: '#92400e' },
});

const hdrStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, alignItems: 'center', marginRight: 4 },
  btn: { padding: 4 },
  careTeamText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
});
