"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Provider, Review } from '@careequity/core';
import AppointmentForm from '../../../../components/Booking/AppointmentForm';
import ReviewForm from '../../../../components/Reviews/ReviewForm';
import VerificationBadge from '../../../../components/Provider/Badge';
import { Heart } from 'lucide-react';

export default function ProviderProfile() {
  const { id } = useParams();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;

    // Fetch Provider
    fetch(`${API_URL}/providers/${id}`)
      .then(res => res.json())
      .then(setProvider);

    // Fetch Reviews
    fetch(`${API_URL}/providers/${id}/reviews`)
      .then(res => res.json())
      .then(setReviews);

    // Check if saved
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/booking/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIsSaved(data.some((s: { provider: { id: string } }) => s.provider.id === id));
        }
      });
    }
  }, [id]);

  const handleToggleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;

    const res = await fetch(`${API_URL}/booking/save/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      const data = await res.json();
      setIsSaved(data.saved);
    }
  };

  const handleReviewSubmit = async (review: Pick<Review, 'rating_total' | 'content'>) => {
    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;
    const token = localStorage.getItem('token');

    await fetch(`${API_URL}/providers/${id}/reviews`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(review),
    });
    alert("Review submitted for moderation.");
  };

  if (!provider) return <p className="p-8">Loading profile...</p>;

  return (
    <div className="container mx-auto p-8 max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="flex gap-6 items-start">
            <div className="w-32 h-32 rounded-full overflow-hidden border bg-slate-100 flex-shrink-0">
              <img src={provider.profile_image_url} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h1 className="text-4xl font-bold text-slate-900">{provider.name}</h1>
                <button 
                  onClick={handleToggleSave}
                  className={`p-2 rounded-full border transition-colors ${isSaved ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                >
                  <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
              <p className="text-xl text-slate-500 font-medium mt-1">{provider.specialties?.join(', ')}</p>
              <div className="mt-4">
                <VerificationBadge tier={provider.verification_tier} />
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-4">About the Practice</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-400 uppercase text-xs mb-1">Location</p>
                <p>{provider.address?.street}</p>
                <p>{provider.address?.city}, {provider.address?.state} {provider.address?.zip}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-400 uppercase text-xs mb-1">Languages</p>
                <p>{provider.languages?.join(', ')}</p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Patient Reviews</h2>
            <div className="space-y-6">
              {reviews.length === 0 ? <p className="text-slate-400 italic">No reviews yet. Be the first to share your experience!</p> : (
                reviews.map(r => (
                  <div key={r.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex text-yellow-400">
                        {Array.from({length: 5}).map((_, i) => (
                          <span key={i}>{i < r.rating_total ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span className="text-sm text-slate-400 font-medium">Verified Patient</span>
                    </div>
                    <p className="text-slate-700">{r.content}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-8">
              <ReviewForm onSubmit={handleReviewSubmit} />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <AppointmentForm providerId={id as string} onSuccess={() => {}} />
          
          <section className="p-4 border rounded-lg bg-white shadow-sm">
            <h3 className="font-bold mb-3">Practice Hours</h3>
            <div className="space-y-2 text-sm">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <div key={day} className="flex justify-between">
                  <span className="text-slate-500">{day}</span>
                  <span className="font-medium">{provider.availability?.[day.toLowerCase() as keyof typeof provider.availability] || '9:00 AM - 5:00 PM'}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
