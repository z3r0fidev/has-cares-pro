/**
 * Thin fetch wrapper used for all authenticated API calls.
 * On 401, clears the stored JWT and redirects to /login so users
 * are never silently stuck with an expired token.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      // Preserve the current locale prefix (e.g. /en, /es, /ar)
      const locale = window.location.pathname.split('/')[1] || 'en';
      window.location.href = `/${locale}/login`;
    }
  }

  return res;
}
