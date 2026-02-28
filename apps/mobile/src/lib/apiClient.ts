// In dev: Android emulator → 10.0.2.2, iOS simulator → localhost
// Override by setting EXPO_PUBLIC_API_URL in .env
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://10.0.2.2:3001' : 'https://api.careequity.org');

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
};

export { API_URL };
