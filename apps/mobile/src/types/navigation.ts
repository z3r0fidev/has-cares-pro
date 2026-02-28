export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Search: undefined;
  Profile: { id: string };
  Booking: {
    providerId: string;
    providerName: string;
    availability?: Record<string, string>;
  };
  Confirmation: {
    providerName: string;
    date: string;
    reason: string;
  };
  CareTeam: undefined;
};

// Legacy alias kept for backward compat with existing navigator usages
export type RootStackParamList = AppStackParamList & AuthStackParamList;
