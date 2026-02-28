"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PracticeForm from '../../../../components/Portal/PracticeForm';
import StatsCard from './StatsCard';
import { Provider } from '@careequity/core';

function computeCompleteness(p: Provider): { score: number; missing: string[] } {
  const checks: Array<[boolean, string]> = [
    [!!p.name, 'Name'],
    [p.credentials?.length > 0, 'Credentials'],
    [p.specialties?.length > 0, 'Specialties'],
    [p.languages?.length > 0, 'Languages'],
    [!!p.insurance, 'Insurance'],
    [!!(p.address?.street), 'Address'],
    [!!p.bio, 'Bio'],
    [!!p.profile_image_url, 'Profile photo'],
    [p.identity_tags?.length > 0, 'Cultural competency tags'],
    [!!p.availability && Object.keys(p.availability).length > 0, 'Availability hours'],
  ];
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  const score = Math.round(((checks.length - missing.length) / checks.length) * 100);
  return { score, missing };
}

export default function Dashboard() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRequestVerification = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const hostname = window.location.hostname;
      const API_URL = `http://${hostname}:3001`;
      
      const res = await fetch(`${API_URL}/providers/verify-request`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert("Verification request submitted successfully! An administrator will review your profile.");
      }
    } catch {
      alert("Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (role === 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const API_URL = `http://${hostname}:3001`;
    
    const fetchData = async () => {
      try {
        const profileRes = await fetch(`${API_URL}/providers/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profileRes.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        if (!profileRes.ok) throw new Error("Failed to load profile");
        const profileData = await profileRes.json();
        setProvider(profileData);

        const statsRes = await fetch(`${API_URL}/analytics/stats/${profileData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setError(`Failed to connect to the server at ${API_URL}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <div className="p-8 text-center" role="status"><p className="animate-pulse">Loading Dashboard...</p></div>;

  if (error) return (
    <div className="p-8 text-center space-y-4" role="alert">
      <p className="text-red-600 font-medium">{error}</p>
      <button 
        onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
        className="text-blue-600 underline focus:ring-2 focus:ring-blue-500 rounded"
      >
        Go back to Login
      </button>
    </div>
  );

  if (!provider) return <p className="p-8 text-center" role="status">No provider data available.</p>;

  return (
    <main className="container mx-auto p-8" suppressHydrationWarning>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
          <p className="text-slate-500">Manage your practice and track patient engagement.</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="text-sm text-red-700 font-bold hover:underline px-4 py-2 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 transition-colors focus:ring-2 focus:ring-red-500"
          aria-label="Log out of provider portal"
        >
          Logout
        </button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border" aria-labelledby="engagement-title">
            <h2 id="engagement-title" className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Engagement Overview</h2>
            <StatsCard stats={stats} />
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border" aria-labelledby="practice-title">
            <h2 id="practice-title" className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Practice Information</h2>
            <PracticeForm provider={provider} />
          </section>
        </div>
        
        <aside className="space-y-8">
          {/* Profile completeness */}
          {(() => {
            const { score, missing } = computeCompleteness(provider);
            return (
              <section className="bg-white p-6 rounded-lg shadow-sm border" aria-label="Profile Completeness">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-slate-700">Profile {score}% complete</h3>
                  {score < 100 && (
                    <Link href="/portal/onboarding" className="text-xs font-semibold text-primary hover:underline">
                      Complete profile
                    </Link>
                  )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 mb-3">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${score}%` }}
                    role="progressbar"
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                {missing.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Missing</p>
                    <ul className="space-y-0.5">
                      {missing.map((field) => (
                        <li key={field} className="text-xs text-slate-500 flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                          {field}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            );
          })()}

          <section className="bg-white p-6 rounded-lg shadow-sm border text-center" aria-label="Physician Profile Summary">
            <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 border overflow-hidden">
              {provider.profile_image_url ? (
                <img src={provider.profile_image_url} alt={`Headshot of ${provider.name}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold" aria-hidden="true">
                  {provider.name?.charAt(0)}
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900">{provider.name}</h3>
            <p className="text-sm text-slate-500">{provider.specialties?.join(', ')}</p>
            
            <div className="mt-6 text-left space-y-3 border-t pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                provider.verification_tier === 3 ? 'bg-green-100 text-green-900 border-green-200' :
                provider.verification_tier === 2 ? 'bg-blue-100 text-blue-900 border-blue-200' :
                'bg-slate-100 text-slate-900 border-slate-200'
              }`}>
                Tier {provider.verification_tier} Verified
              </span>
              
              {provider.verification_tier < 3 ? (
                <button 
                  onClick={handleRequestVerification}
                  disabled={submitting}
                  className="block w-full mt-4 text-xs font-bold text-blue-700 hover:text-blue-900 disabled:text-slate-400 underline underline-offset-4 focus:ring-2 focus:ring-blue-500 rounded"
                  aria-label={`Submit request to upgrade from Tier ${provider.verification_tier} verification`}
                >
                  {submitting ? 'Submitting...' : 'Request Tier Upgrade'}
                </button>
              ) : (
                <p className="mt-4 text-[10px] text-green-700 font-bold uppercase tracking-tight text-center bg-green-50 py-1 rounded">
                  Maximum Verification Reached
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
