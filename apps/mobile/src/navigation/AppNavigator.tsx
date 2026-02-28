import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList, AppStackParamList } from '../types/navigation';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import ConfirmationScreen from '../screens/ConfirmationScreen';
import CareTeamScreen from '../screens/CareTeamScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

const BRAND_GOLD = '#F5BE00';
const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#fff' },
  headerTitleStyle: { fontWeight: 'bold' as const },
  headerTintColor: '#0f172a',
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ ...HEADER_OPTS, headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={HEADER_OPTS}>
      <AppStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'CareEquity', headerLargeTitle: true }}
      />
      <AppStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Physician Profile' }}
      />
      <AppStack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Request Appointment' }}
      />
      <AppStack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{ title: 'Appointment Requested', headerBackVisible: false }}
      />
      <AppStack.Screen
        name="CareTeam"
        component={CareTeamScreen}
        options={{ title: 'My Care Team' }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={BRAND_GOLD} />
      </View>
    );
  }

  return token ? <AppNavigator /> : <AuthNavigator />;
}
