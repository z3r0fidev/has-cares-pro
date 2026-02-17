"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PracticeForm from '../../../components/Portal/PracticeForm';

export default function Dashboard() {
  const [provider, setProvider] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    // In a real app, we'd decode the JWT to get the providerId or have a /me endpoint
    // For this prototype, we'll fetch the first provider just to show functionality
    fetch(`${API_URL}/providers`)
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) setProvider(data[0]);
      });
  }, [router]);

  if (!provider) return <p className="p-8">Loading Dashboard...</p>;

  return (
    <div className="container mx-auto p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Provider Dashboard</h1>
        <button 
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
          className="text-sm text-red-600 hover:underline"
        >
          Logout
        </button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Practice Information</h2>
            <PracticeForm provider={provider} />
          </section>
        </div>
        
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow-sm border text-center">
            <div className="w-24 h-24 rounded-full bg-slate-100 mx-auto mb-4 border overflow-hidden">
              <img src={provider.profile_image_url} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-lg">{provider.name}</h3>
            <p className="text-sm text-muted-foreground">{provider.specialties?.join(', ')}</p>
            <div className="mt-4">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                Tier {provider.verification_tier} Verified
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
