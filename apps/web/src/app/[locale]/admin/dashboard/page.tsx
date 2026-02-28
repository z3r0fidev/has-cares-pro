"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@careequity/ui";
import { Provider, Review } from "@careequity/core";

export interface PendingVerification {
  id: string;
  provider: Provider;
  tier: number;
}

export interface PerformanceStats {
  avg_response_time: string;
  max_response_time: string;
  search_count: string;
}

export interface ClaimStats {
  total_providers: number;
  claimed_providers: number;
  claim_rate: number;
}

interface UnclaimedProvider {
  id: string;
  name: string;
  specialties: string[];
  address: { city: string; state: string };
}

export default function AdminDashboard() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [performance, setPerformance] = useState<PerformanceStats | null>(null);
  const [claims, setClaims] = useState<ClaimStats | null>(null);
  const [unclaimed, setUnclaimed] = useState<UnclaimedProvider[]>([]);
  const [unclaimedExpanded, setUnclaimedExpanded] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<Record<string, string>>({});
  const [inviteSending, setInviteSending] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    // In a real app, verify admin role from token/API
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [verRes, revRes, perfRes, claimRes, unclaimedRes] = await Promise.all([
          fetch(`${API_URL}/admin/verifications/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/admin/reviews/flagged`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/analytics/admin/performance`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/analytics/admin/claims`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/admin/providers/unclaimed`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        if (verRes.ok) setVerifications(await verRes.json());
        if (revRes.ok) setReviews(await revRes.json());
        if (perfRes.ok) setPerformance(await perfRes.json());
        if (claimRes.ok) setClaims(await claimRes.json());
        if (unclaimedRes.ok) {
          const data = await unclaimedRes.json();
          setUnclaimed(data.providers || []);
        }
      } catch (err) {
        console.error("Admin load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSendInvite = async (providerId: string) => {
    const email = inviteEmail[providerId];
    if (!email) return;
    setInviteSending(providerId);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/invitations/send/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert(`Invitation sent to ${email}`);
        setInviteEmail((prev) => ({ ...prev, [providerId]: '' }));
      } else {
        const err = await res.json();
        alert(`Failed: ${err.message}`);
      }
    } catch {
      alert('Failed to send invitation');
    } finally {
      setInviteSending(null);
    }
  };

  const handleVerify = async (id: string, status: 'approved' | 'rejected', tier: number) => {
    const token = localStorage.getItem('token');
    
    await fetch(`${API_URL}/admin/verify/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, tier, notes: `Admin ${status}` }) 
    });
    
    // Refresh list
    setVerifications(verifications.filter(v => v.provider?.id !== id));
  };

  if (loading) return <p className="p-8">Loading Admin Portal...</p>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-900">Admin Moderation Console</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs font-bold text-blue-600 uppercase mb-2">Search Performance (Avg)</p>
          <p className="text-2xl font-bold text-blue-900">{performance?.avg_response_time ? Math.round(parseFloat(performance.avg_response_time)) : 0}ms</p>
          <p className="text-xs text-blue-500 mt-1">Goal: &lt; 1500ms</p>
        </div>
        <div className="p-6 bg-green-50 rounded-lg border border-green-100">
          <p className="text-xs font-bold text-green-600 uppercase mb-2">Provider Adoption (Claimed)</p>
          <p className="text-2xl font-bold text-green-900">{claims?.claim_rate ? Math.round(claims.claim_rate) : 0}%</p>
          <p className="text-xs text-green-500 mt-1">{claims?.claimed_providers || 0} of {claims?.total_providers || 0} profiles</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-xs font-bold text-purple-600 uppercase mb-2">Total Queries</p>
          <p className="text-2xl font-bold text-purple-900">{performance?.search_count ? parseInt(performance.search_count) : 0}</p>
          <p className="text-xs text-purple-500 mt-1">Across all users</p>
        </div>
      </div>

      {/* Unclaimed Providers */}
      <section className="bg-white p-6 rounded-lg shadow-sm border mb-8">
        <button
          onClick={() => setUnclaimedExpanded((v) => !v)}
          className="flex w-full justify-between items-center text-left"
          aria-expanded={unclaimedExpanded}
        >
          <h2 className="text-xl font-bold text-slate-800">
            Unclaimed Providers
            <span className="ml-2 text-sm font-normal text-slate-400">({unclaimed.length})</span>
          </h2>
          <span className="text-slate-400 text-lg">{unclaimedExpanded ? '▲' : '▼'}</span>
        </button>

        {unclaimedExpanded && (
          <ul className="mt-4 divide-y divide-slate-100">
            {unclaimed.length === 0 ? (
              <li className="py-3 text-sm text-slate-400">All providers have been claimed.</li>
            ) : (
              unclaimed.map((p) => (
                <li key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-grow">
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      {p.specialties?.[0] || 'General'} · {p.address?.city}, {p.address?.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="email"
                      placeholder="provider@email.com"
                      value={inviteEmail[p.id] || ''}
                      onChange={(e) => setInviteEmail((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="text-sm p-1.5 border rounded-lg focus:ring-2 focus:ring-primary w-48"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSendInvite(p.id)}
                      disabled={inviteSending === p.id || !inviteEmail[p.id]}
                    >
                      {inviteSending === p.id ? 'Sending…' : 'Send Invite'}
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-orange-600">Pending Verifications</h2>
          {verifications.length === 0 ? <p>No pending requests.</p> : (
            <ul className="space-y-4">
              {verifications.map(v => (
                <li key={v.id} className="p-4 border rounded bg-slate-50 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{v.provider?.name || 'Unknown Provider'}</p>
                    <p className="text-sm text-slate-500">Requested Tier: {v.tier}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleVerify(v.provider.id, 'approved', v.tier)} className="bg-green-600 hover:bg-green-700">Approve</Button>
                    <Button onClick={() => handleVerify(v.provider.id, 'rejected', v.tier)} variant="destructive">Reject</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold mb-4 text-red-600">Flagged Reviews</h2>
          {reviews.length === 0 ? <p>No flagged reviews.</p> : (
            <ul className="space-y-4">
              {reviews.map(r => (
                <li key={r.id} className="p-4 border rounded bg-slate-50">
                  <p className="italic mb-2">"{r.content}"</p>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline">Dismiss</Button>
                    <Button size="sm" variant="destructive">Delete</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
