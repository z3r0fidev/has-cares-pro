"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Calendar } from 'lucide-react';
import { Provider } from '@careequity/core';

export interface SavedProvider {
  id: string;
  provider: Provider;
}

export interface Appointment {
  id: string;
  provider: Provider;
  appointment_date: string;
  status: string;
}

export default function CareTeam() {
  const [saved, setSaved] = useState<SavedProvider[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;

    const fetchData = async () => {
      try {
        const [savedRes, apptRes] = await Promise.all([
          fetch(`${API_URL}/booking/saved`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/booking/my-appointments`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (savedRes.ok) setSaved(await savedRes.json());
        if (apptRes.ok) setAppointments(await apptRes.json());
      } catch (err) {
        console.error("Care Team load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) return <p className="p-8">Loading Care Team...</p>;

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 flex items-center gap-2">
        My Care Team
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Saved Physicians
          </h2>
          {saved.length === 0 ? (
            <div className="p-8 border rounded-lg bg-slate-50 text-center">
              <p className="text-slate-500">You haven't saved any physicians to your care team yet.</p>
              <Link href="/" className="text-primary font-bold mt-2 inline-block">Find a Physician</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {saved.map(s => (
                <Link key={s.id} href={`/providers/${s.provider.id}`} className="p-4 border rounded-lg hover:shadow-md transition-shadow flex items-center gap-4 bg-white">
                  <div className="w-12 h-12 rounded-full overflow-hidden border bg-slate-100 flex-shrink-0">
                    <img src={s.provider.profile_image_url} alt={s.provider.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{s.provider.name}</p>
                    <p className="text-xs text-slate-500">{s.provider.specialties?.join(', ')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming Appointments
          </h2>
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No scheduled appointments.</p>
            ) : (
              appointments.map(a => (
                <div key={a.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <p className="font-bold text-sm">{new Date(a.appointment_date).toLocaleDateString()} at {new Date(a.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-xs text-slate-500 mb-2">with {a.provider.name}</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    a.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
