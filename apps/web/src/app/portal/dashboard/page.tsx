"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PracticeForm from '../../../components/Portal/PracticeForm';
import StatsCard from './StatsCard';

export default function Dashboard() {
  const [provider, setProvider] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
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
    } catch (err) {
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
    
    // Fetch Profile and Stats
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

        // Fetch Stats
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

  if (loading) return <div className="p-8 text-center"><p className="animate-pulse">Loading Dashboard...</p></div>;

  if (error) return (
    <div className="p-8 text-center space-y-4">
      <p className="text-red-600 font-medium">{error}</p>
      <button 
        onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
        className="text-blue-600 underline"
      >
        Go back to Login
      </button>
    </div>
  );

  if (!provider) return <p className="p-8 text-center">No provider data available.</p>;

  return (
    <div className="container mx-auto p-8" suppressHydrationWarning>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
          <p className="text-slate-500">Manage your practice and track patient engagement.</p>
        </div>
        <button 
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="text-sm text-red-600 font-medium hover:underline px-4 py-2 border border-red-100 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-6 text-slate-800 border-b pb-2">Engagement Overview</h2>
            <StatsCard stats={stats} />
          </section>

          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4 text-slate-800 border-b pb-2">Practice Information</h2>
            <PracticeForm provider={provider} />
          </section>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 border overflow-hidden">
              {provider.profile_image_url ? (
                <img src={provider.profile_image_url} alt={provider.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                  {provider.name?.charAt(4)}
                </div>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-900">{provider.name}</h3>
            <p className="text-sm text-slate-500">{provider.specialties?.join(', ')}</p>
            <div className="mt-4 text-left space-y-2 border-t pt-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verification Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                provider.verification_tier === 3 ? 'bg-green-100 text-green-800' :
                provider.verification_tier === 2 ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                Tier {provider.verification_tier} Verified
              </span>
              {provider.verification_tier < 3 ? (
                <button 
                  onClick={handleRequestVerification}
                  disabled={submitting}
                  className="block w-full mt-4 text-xs font-bold text-primary hover:text-primary/80 disabled:text-slate-400 underline underline-offset-4"
                >
                  {submitting ? 'Submitting...' : 'Request Tier Upgrade'}
                </button>
              ) : (
                <p className="mt-4 text-[10px] text-green-600 font-bold uppercase tracking-tight text-center">
                  Maximum Verification Reached
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
