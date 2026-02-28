"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Calendar, Star, MapPin } from 'lucide-react';
import { Provider } from '@careequity/core';
import StarRating from '../../../../components/Provider/StarRating';

export interface SavedProvider {
  id: string;
  provider: Provider;
}

export interface Appointment {
  id: string;
  provider: Provider;
  appointment_date: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason?: string;
}

export interface MyReview {
  id: string;
  provider: Provider;
  rating_total: number;
  content: string;
  status: string;
  created_at: string;
}

function formatAppointmentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-slate-100 text-slate-500 line-through',
  completed: 'bg-blue-100 text-blue-800',
};

export default function CareTeam() {
  const [saved, setSaved] = useState<SavedProvider[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;
    const headers = { 'Authorization': `Bearer ${token}` };

    const fetchData = async () => {
      try {
        const [savedRes, apptRes, reviewRes] = await Promise.all([
          fetch(`${API_URL}/booking/saved`, { headers }),
          fetch(`${API_URL}/booking/my-appointments`, { headers }),
          fetch(`${API_URL}/providers/my-reviews`, { headers }),
        ]);

        if (savedRes.ok) setSaved(await savedRes.json());
        if (apptRes.ok) setAppointments(await apptRes.json());
        if (reviewRes.ok) setReviews(await reviewRes.json());
      } catch (err) {
        console.error("Care Team load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleCancel = async (apptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    const token = localStorage.getItem('token');
    const hostname = window.location.hostname;
    setCancellingId(apptId);

    try {
      const res = await fetch(`http://${hostname}:3001/booking/appointment/${apptId}/cancel`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setAppointments(prev =>
          prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a)
        );
      }
    } catch (err) {
      console.error("Cancel failed", err);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <p className="p-8 text-slate-500">Loading Care Team...</p>;

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">My Care Team</h1>

      <div className="space-y-10">
        {/* ── Saved Physicians ── */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            Saved Physicians
          </h2>
          {saved.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-2">You haven't saved any providers yet.</p>
              <Link href="/" className="text-primary font-semibold hover:underline">Find a Physician</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saved.map(s => (
                <Link
                  key={s.id}
                  href={`/providers/${s.provider.id}`}
                  className="p-4 border rounded-xl hover:shadow-md transition-shadow flex items-center gap-4 bg-white"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border bg-slate-100 flex-shrink-0">
                    {s.provider.profile_image_url ? (
                      <img src={s.provider.profile_image_url} alt={s.provider.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
                        {s.provider.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{s.provider.name}</p>
                    <p className="text-xs text-slate-500 truncate">{s.provider.specialties?.join(', ')}</p>
                    {s.provider.address && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {s.provider.address.city}, {s.provider.address.state}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Upcoming Appointments ── */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Calendar className="w-5 h-5 text-blue-500" />
            Upcoming Appointments
          </h2>
          {appointments.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No upcoming appointments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => (
                <div key={a.id} className="p-4 border rounded-xl bg-white shadow-sm flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{formatAppointmentDate(a.appointment_date)}</p>
                    <p className="text-sm text-slate-500 mt-0.5">with {a.provider.name}</p>
                    {a.reason && <p className="text-xs text-slate-400 mt-1 italic">{a.reason}</p>}
                    <span className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      STATUS_STYLES[a.status] ?? 'bg-slate-100 text-slate-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancel(a.id)}
                      disabled={cancellingId === a.id}
                      className="text-xs font-medium text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {cancellingId === a.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── My Reviews ── */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
            <Star className="w-5 h-5 text-amber-500 fill-current" />
            My Reviews
          </h2>
          {reviews.length === 0 ? (
            <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">You haven't submitted any reviews yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="p-4 border rounded-xl bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <Link
                      href={`/providers/${r.provider.id}`}
                      className="font-semibold text-slate-900 hover:text-primary transition-colors"
                    >
                      {r.provider.name}
                    </Link>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'published' ? 'bg-green-100 text-green-800' :
                      r.status === 'flagged' ? 'bg-red-100 text-red-800' :
                      r.status === 'rejected' ? 'bg-slate-100 text-slate-500' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  <StarRating rating={r.rating_total} size="sm" />
                  <p className="text-sm text-slate-600 mt-2">{r.content}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(r.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
