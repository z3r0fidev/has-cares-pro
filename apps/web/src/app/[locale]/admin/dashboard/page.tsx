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

export default function AdminDashboard() {
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    // In a real app, verify admin role from token/API
    if (!token) {
      router.push('/login');
      return;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    const fetchData = async () => {
      try {
        const [verRes, revRes] = await Promise.all([
          fetch(`${API_URL}/admin/verifications/pending`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${API_URL}/admin/reviews/flagged`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (verRes.ok) setVerifications(await verRes.json());
        if (revRes.ok) setReviews(await revRes.json());
      } catch (err) {
        console.error("Admin load failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleVerify = async (id: string, status: 'approved' | 'rejected', tier: number) => {
    const token = localStorage.getItem('token');
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
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
