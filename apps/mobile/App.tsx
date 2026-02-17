import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';

const App = () => {
  return (
    <SafeAreaView>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>CareEquity Mobile</Text>
        <Text style={{ marginTop: 10 }}>Search for minority providers near you.</Text>
        {/* Search UI Placeholder */}
      </View>
    </SafeAreaView>
  );
};

export default App;
