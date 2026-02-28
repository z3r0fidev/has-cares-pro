"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ProviderPreview {
  providerName: string;
  specialty: string | null;
  city: string | null;
  state: string | null;
}

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [preview, setPreview] = useState<ProviderPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const stored = localStorage.getItem('token');
    if (stored) setIsLoggedIn(true);

    fetch(`${API_URL}/invitations/preview/${token}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setError('This invitation link has expired or been used.');
        } else {
          setPreview(data);
        }
      })
      .catch(() => setError('Failed to load invitation details.'))
      .finally(() => setLoading(false));
  }, [token, API_URL]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setLoginError('Invalid email or password.');
        return;
      }
      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      if (data.role) localStorage.setItem('user_role', data.role);
      setIsLoggedIn(true);
    } catch {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const authToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/invitations/claim/${token}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Claim failed. Please try again.');
        return;
      }
      router.push('/portal/onboarding');
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="animate-pulse text-slate-400">Loading invitation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">⚠️</p>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Invitation Unavailable</h1>
          <p className="text-sm text-slate-500 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
          >
            Back to search
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Provider card */}
        <div className="bg-white border rounded-xl p-6 shadow-sm">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Claim Your Profile</p>
          <h1 className="text-2xl font-bold text-slate-900">{preview?.providerName}</h1>
          {preview?.specialty && (
            <p className="text-sm text-slate-500 mt-1">{preview.specialty}</p>
          )}
          {(preview?.city || preview?.state) && (
            <p className="text-sm text-slate-400 mt-0.5">
              {[preview.city, preview.state].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        {/* Auth / Claim section */}
        {!isLoggedIn ? (
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Sign in to claim this profile</h2>
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  placeholder="••••••••"
                />
              </div>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
              <button
                type="submit"
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white border rounded-xl p-6 shadow-sm text-center space-y-4">
            <p className="text-sm text-slate-600">
              You&apos;re signed in. Click below to claim <strong>{preview?.providerName}</strong>&apos;s profile.
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors disabled:opacity-50"
            >
              {claiming ? 'Claiming…' : 'Claim this profile'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
