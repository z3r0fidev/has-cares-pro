import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { SPECIALTIES, INSURANCE_PROVIDERS } from '@careequity/core/src/types/index';

interface FilterState {
  specialty: string;
  insurance: string;
  radius: number;
}

interface Props {
  visible: boolean;
  current: FilterState;
  onApply: (filters: FilterState) => void;
  onClose: () => void;
}

const RADII = [5, 10, 25, 50];

type Tab = 'specialty' | 'insurance' | 'radius';

export default function FilterSheet({ visible, current, onApply, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('specialty');
  const [specialty, setSpecialty] = useState(current.specialty);
  const [insurance, setInsurance] = useState(current.insurance);
  const [radius, setRadius] = useState(current.radius);

  const handleApply = () => {
    onApply({ specialty, insurance, radius });
    onClose();
  };

  const handleClear = () => {
    setSpecialty('');
    setInsurance('');
    setRadius(25);
  };

  const specialtyItems = ['', ...SPECIALTIES.sort()];
  const insuranceItems = ['', ...INSURANCE_PROVIDERS.sort()];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <X size={22} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(['specialty', 'insurance', 'radius'] as Tab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {tab === 'radius' ? (
          <View style={styles.radiusList}>
            {RADII.map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusRow, radius === r && styles.radiusRowActive]}
                onPress={() => setRadius(r)}
              >
                <Text style={styles.radiusLabel}>{r} miles</Text>
                {radius === r && <Check size={18} color="#ca8a04" />}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <FlatList
            data={tab === 'specialty' ? specialtyItems : insuranceItems}
            keyExtractor={item => item || '__all__'}
            renderItem={({ item }) => {
              const selected = tab === 'specialty' ? specialty === item : insurance === item;
              const label = item || (tab === 'specialty' ? 'All Specialties' : 'All Insurance');
              return (
                <TouchableOpacity
                  style={[styles.listItem, selected && styles.listItemActive]}
                  onPress={() =>
                    tab === 'specialty' ? setSpecialty(item) : setInsurance(item)
                  }
                >
                  <Text style={[styles.listLabel, selected && styles.listLabelActive]}>
                    {label}
                  </Text>
                  {selected && <Check size={16} color="#ca8a04" />}
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearText}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#F5BE00' },
  tabText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  tabTextActive: { color: '#0f172a' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  listItemActive: { backgroundColor: '#fef9c3' },
  listLabel: { fontSize: 15, color: '#334155' },
  listLabelActive: { color: '#0f172a', fontWeight: '600' },
  radiusList: { padding: 16 },
  radiusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 10, marginBottom: 8, backgroundColor: '#f8fafc' },
  radiusRowActive: { backgroundColor: '#fef9c3', borderWidth: 1, borderColor: '#F5BE00' },
  radiusLabel: { fontSize: 16, color: '#334155', fontWeight: '500' },
  footer: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  clearBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  clearText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  applyBtn: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#F5BE00', alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
});
