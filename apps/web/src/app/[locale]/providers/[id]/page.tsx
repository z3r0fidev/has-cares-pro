"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Provider, Review } from '@careequity/core';
import AppointmentForm from '../../../../components/Booking/AppointmentForm';
import InlineAvailabilityGrid from '../../../../components/Booking/InlineAvailabilityGrid';
import ReviewForm from '../../../../components/Reviews/ReviewForm';
import VerificationBadge from '../../../../components/Provider/Badge';
import StarRating from '../../../../components/Provider/StarRating';
import InsuranceLogo from '../../../../components/Insurance/InsuranceLogo';
import { Heart, MapPin, Globe, Phone, ExternalLink, Video } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../../../lib/apiFetch';

function avgRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, r) => sum + r.rating_total, 0) / reviews.length;
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABEL: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

export default function ProviderProfile() {
  const { id } = useParams();
  const router = useRouter();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>(undefined);
  const [fetchError, setFetchError] = useState<'not_found' | 'server_error' | null>(null);

  useEffect(() => {
    if (!id) return;
    const hostname = window.location.hostname;
    const API_URL = `http://${hostname}:3001`;

    fetch(`${API_URL}/providers/${id}`)
      .then((res) => {
        if (res.status === 404) { setFetchError('not_found'); return null; }
        if (!res.ok) { setFetchError('server_error'); return null; }
        return res.json();
      })
      .then((data) => { if (data) setProvider(data); })
      .catch(() => setFetchError('server_error'));

    fetch(`${API_URL}/providers/${id}/reviews`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setReviews)
      .catch(() => {});

    const token = localStorage.getItem('token');
    if (token) {
      apiFetch(`${API_URL}/booking/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
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
    const res = await apiFetch(`${API_URL}/booking/save/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setIsSaved(data.saved);
      toast.success(data.saved ? 'Provider saved to your care team.' : 'Removed from care team.');
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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(review),
    });
    toast.info('Review submitted for moderation. Thank you!');
  };

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">{fetchError === 'not_found' ? '404' : '500'}</p>
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            {fetchError === 'not_found' ? 'Provider not found' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {fetchError === 'not_found'
              ? 'This provider profile may have been removed or the link is incorrect.'
              : 'We had trouble loading this profile. Please try again.'}
          </p>
          <a href="/" className="inline-block px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors">
            Back to search
          </a>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading profile…</div>
      </div>
    );
  }

  const rating = avgRating(reviews);
  const insuranceList = provider.insurance
    ? provider.insurance.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Hero Header ── */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex gap-6 items-start">
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-100 flex-shrink-0 shadow-sm">
              {provider.profile_image_url ? (
                <img
                  src={provider.profile_image_url}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-slate-400">
                  {provider.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Name / meta */}
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                    {provider.name}
                  </h1>
                  <p className="text-base text-slate-500 mt-0.5">
                    {provider.credentials?.join(', ')}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {provider.specialties?.join(' · ')}
                  </p>
                </div>

                <button
                  onClick={handleToggleSave}
                  aria-label={isSaved ? 'Remove from care team' : 'Save to care team'}
                  className={`flex-shrink-0 p-2.5 rounded-full border-2 transition-colors ${
                    isSaved
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-3">
                <VerificationBadge tier={provider.verification_tier} />

                {reviews.length > 0 && (
                  <StarRating rating={rating} count={reviews.length} size="sm" />
                )}

                {provider.address && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {provider.address.city}, {provider.address.state}
                  </span>
                )}

                {provider.telehealth_url && (
                  <span className="flex items-center gap-1 text-xs text-[#1A73E8] font-medium">
                    <Video className="w-3 h-3" />
                    Telehealth Available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left / Main Column ── */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">About the Practice</h2>
              {provider.bio && (
                <p className="text-sm text-slate-700 leading-relaxed mb-4">{provider.bio}</p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Address
                  </p>
                  <p className="text-slate-700">{provider.address?.street}</p>
                  <p className="text-slate-700">
                    {provider.address?.city}, {provider.address?.state}{' '}
                    {provider.address?.zip}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                    Languages
                  </p>
                  <p className="text-slate-700">{provider.languages?.join(', ')}</p>
                </div>

                {provider.identity_tags?.length > 0 && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Identity
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.identity_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-slate-700 rounded-full border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(provider.website_url || provider.telehealth_url) && (
                  <div className="space-y-2 col-span-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                      Links
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {provider.website_url && (
                        <a
                          href={provider.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-[#1A73E8] hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Practice Website
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                      {provider.telehealth_url && (
                        <a
                          href={provider.telehealth_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-[#1A73E8] hover:underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Telehealth Portal
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Insurance */}
            {insuranceList.length > 0 && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">
                  Insurance Accepted
                </h2>
                <div className="flex flex-wrap gap-2">
                  {insuranceList.map((ins) => (
                    <span
                      key={ins}
                      className="text-xs px-3 py-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#16A34A]/30 bg-[#16A34A]/5 text-[#16A34A] font-medium"
                    >
                      <InsuranceLogo name={ins} size={14} />
                      {ins}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">
                Patient Reviews
                {reviews.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-400">
                    ({reviews.length})
                  </span>
                )}
              </h2>

              {reviews.length > 0 && (
                <div className="mb-4">
                  <StarRating rating={rating} count={reviews.length} />
                </div>
              )}

              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">
                    No reviews yet — be the first to share your experience.
                  </p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2 mb-2">
                        <StarRating rating={r.rating_total} size="sm" />
                        <span className="text-xs text-slate-400 font-medium">Verified Patient</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{r.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <ReviewForm onSubmit={handleReviewSubmit} />
              </div>
            </section>
          </div>

          {/* ── Right / Booking Sidebar ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5 shadow-sm sticky top-4 space-y-5">
              {/* Availability grid */}
              <InlineAvailabilityGrid
                availability={provider.availability}
                onSlotSelect={setSelectedSlot}
              />

              <div className="border-t border-slate-100 pt-4">
                <AppointmentForm
                  providerId={id as string}
                  providerName={provider.name}
                  onSuccess={() => setSelectedSlot(undefined)}
                  defaultDateTime={selectedSlot}
                />
              </div>
            </div>

            {/* Practice hours */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Office Hours</h3>
              <div className="space-y-2 text-sm">
                {DAY_ORDER.map((day) => {
                  const hours = provider.availability?.[day as keyof typeof provider.availability];
                  return (
                    <div key={day} className="flex justify-between items-center">
                      <span className="text-slate-500 w-8">{DAY_LABEL[day]}</span>
                      <span className={`font-medium ${hours ? 'text-slate-800' : 'text-slate-300'}`}>
                        {hours ?? 'Closed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phone */}
            <div className="bg-white rounded-xl border p-5">
              <button
                onClick={() => toast.info('Contact information shown after login.')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Show Phone Number
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
