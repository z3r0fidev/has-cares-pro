"use client";

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProviderMatch {
  id: string;
  name: string;
  specialties: string[];
}

interface ReferralModalProps {
  /** Whether the dialog is open. Controlled from outside. */
  open: boolean;
  /** Called when the dialog should close. */
  onClose: () => void;
}

/**
 * Modal form that lets a logged-in provider refer a patient (by email) to
 * another CareEquity provider (searched by name).
 *
 * Flow:
 *  1. Provider types patient email and target provider name.
 *  2. Provider search fires after >=3 chars with a 400 ms debounce.
 *  3. Provider selects target from the dropdown.
 *  4. Optional note can be added.
 *  5. Submit calls POST /referrals.
 */
export default function ReferralModal({ open, onClose }: ReferralModalProps) {
  const [patientEmail, setPatientEmail] = useState('');
  const [providerQuery, setProviderQuery] = useState('');
  const [providerResults, setProviderResults] = useState<ProviderMatch[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderMatch | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const API_URL = `http://${hostname}:3001`;

  /** Resolves a patient's UUID from their email via a simple lookup. */
  const resolvePatientId = async (email: string, token: string): Promise<string | null> => {
    try {
      const res = await fetch(
        `${API_URL}/auth/lookup?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return null;
      const data = await res.json() as { id: string };
      return data.id ?? null;
    } catch {
      return null;
    }
  };

  /** Debounced provider name search. */
  const handleProviderQueryChange = useCallback(
    (value: string) => {
      setProviderQuery(value);
      setSelectedProvider(null);
      setProviderResults([]);

      if (debounceTimer) clearTimeout(debounceTimer);

      if (value.trim().length < 3) return;

      const timer = setTimeout(async () => {
        setSearching(true);
        try {
          // Use the existing providers search endpoint; supply a generous
          // bounding-box lat/lon so all providers appear (search is by name).
          const res = await fetch(
            `${API_URL}/providers?lat=39.5&lon=-98.35&radius=5000&name=${encodeURIComponent(value.trim())}`,
          );
          if (res.ok) {
            const data = await res.json() as ProviderMatch[];
            // The search endpoint may return an array directly or wrapped
            const list: ProviderMatch[] = Array.isArray(data) ? data : [];
            setProviderResults(list.slice(0, 8));
          }
        } catch {
          // Fail silently — user can still type the full name
        } finally {
          setSearching(false);
        }
      }, 400);

      setDebounceTimer(timer);
    },
    [debounceTimer, API_URL],
  );

  const handleSelectProvider = (p: ProviderMatch) => {
    setSelectedProvider(p);
    setProviderQuery(p.name);
    setProviderResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProvider) {
      toast.error('Please select a target provider from the search results.');
      return;
    }
    if (!patientEmail.trim()) {
      toast.error('Please enter the patient\'s email address.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('You are not logged in.');
        return;
      }

      // Step 1: resolve patient UUID from email
      const patientId = await resolvePatientId(patientEmail.trim(), token);
      if (!patientId) {
        toast.error('No CareEquity account found for that email address.');
        return;
      }

      // Step 2: create the referral
      const res = await fetch(`${API_URL}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          toProviderId: selectedProvider.id,
          patientId,
          note: note.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string };
        toast.error(err.message ?? 'Failed to send referral. Please try again.');
        return;
      }

      toast.success('Referral sent successfully!');
      handleClose();
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setPatientEmail('');
    setProviderQuery('');
    setProviderResults([]);
    setSelectedProvider(null);
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Refer a Patient</DialogTitle>
          <DialogDescription>
            Refer one of your patients to another CareEquity provider. The
            receiving provider will be notified and can accept or decline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Target provider search */}
          <div className="space-y-1.5">
            <Label htmlFor="referral-provider">
              Refer to Provider <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="relative">
              <Input
                id="referral-provider"
                type="text"
                placeholder="Search by provider name…"
                value={providerQuery}
                onChange={(e) => handleProviderQueryChange(e.target.value)}
                autoComplete="off"
                required
              />
              {/* Search results dropdown */}
              {(providerResults.length > 0 || searching) && (
                <ul
                  className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
                  role="listbox"
                  aria-label="Provider search results"
                >
                  {searching && (
                    <li className="px-3 py-2 text-sm text-slate-400">Searching…</li>
                  )}
                  {!searching &&
                    providerResults.map((p) => (
                      <li
                        key={p.id}
                        role="option"
                        aria-selected={selectedProvider?.id === p.id}
                        className="px-3 py-2 cursor-pointer hover:bg-slate-50 text-sm text-slate-800 flex flex-col"
                        onMouseDown={() => handleSelectProvider(p)}
                      >
                        <span className="font-medium">{p.name}</span>
                        {p.specialties?.length > 0 && (
                          <span className="text-xs text-slate-400">{p.specialties.slice(0, 2).join(', ')}</span>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            {selectedProvider && (
              <p className="text-xs text-green-700 font-medium mt-1">
                Selected: {selectedProvider.name}
              </p>
            )}
          </div>

          {/* Patient email */}
          <div className="space-y-1.5">
            <Label htmlFor="referral-patient">
              Patient Email <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              id="referral-patient"
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              required
            />
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <Label htmlFor="referral-note">
              Note{' '}
              <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </Label>
            <textarea
              id="referral-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              placeholder="Clinical context or reason for referral…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none resize-none h-24 transition-[color,box-shadow]"
            />
            <p className="text-right text-xs text-slate-400">{note.length}/1000</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !selectedProvider}>
              {submitting ? 'Sending…' : 'Send Referral'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
