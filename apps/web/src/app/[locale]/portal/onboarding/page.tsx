"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { INSURANCE_PROVIDERS, SPECIALTIES } from '@careequity/core';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const DAY_LABEL: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

type Availability = Partial<Record<typeof DAYS[number], string>>;

interface ProviderData {
  id: string;
  bio?: string;
  credentials?: string[];
  profile_image_url?: string;
  availability?: Availability;
  insurance?: string[] | null;
  specialties?: string[];
  identity_tags?: string[];
}

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 — Profile photo
  const [profileImageUrl, setProfileImageUrl] = useState('');

  // Step 2 — Your story
  const [bio, setBio] = useState('');
  const [credentials, setCredentials] = useState('');

  // Step 3 — Availability
  const [availability, setAvailability] = useState<Availability>({});

  // Step 4 — Insurance & specialties
  const [selectedInsurance, setSelectedInsurance] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    fetch(`${API_URL}/providers/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProviderData | null) => {
        if (!data) { router.push('/login'); return; }
        setProvider(data);
        setProfileImageUrl(data.profile_image_url || '');
        setBio(data.bio || '');
        setCredentials(data.credentials?.join(', ') || '');
        setAvailability(data.availability || {});
        setSelectedInsurance(Array.isArray(data.insurance) ? data.insurance : []);
        setSelectedSpecialties(data.specialties || []);
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [router, API_URL]);

  const patch = async (body: Record<string, unknown>) => {
    if (!provider) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}/providers/${provider.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Save failed');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (step === 1) {
        await patch({ profile_image_url: profileImageUrl });
      } else if (step === 2) {
        await patch({
          bio,
          credentials: credentials.split(',').map((c) => c.trim()).filter(Boolean),
        });
      } else if (step === 3) {
        await patch({ availability });
      } else if (step === 4) {
        await patch({
          insurance: selectedInsurance,
          specialties: selectedSpecialties,
        });
      }

      if (step < TOTAL_STEPS) {
        setStep((s) => s + 1);
      } else {
        router.push('/portal/dashboard');
      }
    } catch {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      router.push('/portal/dashboard');
    }
  };

  const toggleItem = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="animate-pulse text-slate-400">Loading…</p>
      </div>
    );
  }

  const STEP_TITLES = ['Profile Photo', 'Your Story', 'Availability', 'Insurance & Specialties'];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">
            Step {step} of {TOTAL_STEPS}
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Complete Your Profile</h1>
          <p className="text-slate-500 text-sm mt-1">{STEP_TITLES[step - 1]}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          {step === 1 && (
            <>
              <label htmlFor="photo-url" className="block text-sm font-medium text-slate-700">
                Profile Photo URL
              </label>
              <input
                id="photo-url"
                type="url"
                value={profileImageUrl}
                onChange={(e) => setProfileImageUrl(e.target.value)}
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                placeholder="https://example.com/your-photo.jpg"
              />
              {profileImageUrl && (
                <div className="flex justify-center">
                  <img
                    src={profileImageUrl}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-slate-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700 mb-1">
                  About You
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary text-sm resize-y"
                  placeholder="Tell patients about your background and approach to care"
                />
              </div>
              <div>
                <label htmlFor="credentials" className="block text-sm font-medium text-slate-700 mb-1">
                  Credentials <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  id="credentials"
                  type="text"
                  value={credentials}
                  onChange={(e) => setCredentials(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  placeholder="MD, FACP, MBA"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Enter hours in <span className="font-mono">HH:MM-HH:MM</span> format (e.g. 09:00-17:00), or leave blank for closed.
              </p>
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-slate-600 flex-shrink-0">{DAY_LABEL[day]}</span>
                  <input
                    type="text"
                    value={availability[day] || ''}
                    onChange={(e) =>
                      setAvailability((prev) => ({
                        ...prev,
                        [day]: e.target.value || undefined,
                      }))
                    }
                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    placeholder="09:00-17:00"
                  />
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <>
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Insurance Accepted</p>
                <div className="flex flex-wrap gap-2">
                  {INSURANCE_PROVIDERS.map((ins) => (
                    <button
                      key={ins}
                      type="button"
                      onClick={() => toggleItem(ins, selectedInsurance, setSelectedInsurance)}
                      aria-pressed={selectedInsurance.includes(ins)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selectedInsurance.includes(ins)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary'
                      }`}
                    >
                      {ins}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleItem(spec, selectedSpecialties, setSelectedSpecialties)}
                      aria-pressed={selectedSpecialties.includes(spec)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        selectedSpecialties.includes(spec)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-primary'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4"
          >
            Skip for now
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : step === TOTAL_STEPS ? 'Finish' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
