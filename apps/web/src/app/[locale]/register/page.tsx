"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from "@careequity/ui";
import Link from 'next/link';

export default function RegisterPage() {
  const t = useTranslations('Register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('errorMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'patient' }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_role', data.user?.role ?? 'patient');
        router.push('/patient/care-team');
      } else if (res.status === 409) {
        setError(t('errorExists'));
      } else {
        setError(t('errorGeneric'));
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50" suppressHydrationWarning>
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md p-8 bg-white rounded-lg shadow-md"
        suppressHydrationWarning
      >
        <h1 className="text-2xl font-bold mb-6 text-slate-900 text-center">{t('title')}</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-4" suppressHydrationWarning>
          <label className="block mb-2 text-sm font-medium text-slate-700">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary text-slate-900"
            required
            suppressHydrationWarning
          />
        </div>

        <div className="mb-4" suppressHydrationWarning>
          <label className="block mb-2 text-sm font-medium text-slate-700">{t('password')}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary text-slate-900"
            required
            minLength={8}
            suppressHydrationWarning
          />
        </div>

        <div className="mb-6" suppressHydrationWarning>
          <label className="block mb-2 text-sm font-medium text-slate-700">{t('confirmPassword')}</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary text-slate-900"
            required
            suppressHydrationWarning
          />
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : t('submit')}
        </Button>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link href="/login" className="text-primary font-medium hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </form>
    </div>
  );
}
