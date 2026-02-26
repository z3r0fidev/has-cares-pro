"use client";

import { useState, useEffect } from 'react';
import { Button } from "@careequity/ui";
import { toast } from "sonner";

interface AppointmentFormProps {
  providerId: string;
  onSuccess: () => void;
  defaultDateTime?: string;
}

export default function AppointmentForm({ providerId, onSuccess, defaultDateTime }: AppointmentFormProps) {
  const [date, setDate] = useState(defaultDateTime ? defaultDateTime.slice(0, 16) : '');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (defaultDateTime) setDate(defaultDateTime.slice(0, 16));
  }, [defaultDateTime]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const hostname = window.location.hostname;
      const API_URL = `http://${hostname}:3001`;
      
      const res = await fetch(`${API_URL}/booking/appointment`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ providerId, date, reason }),
      });

      if (res.ok) {
        toast.success("Appointment request sent! The physician will confirm shortly.");
        onSuccess();
      } else {
        toast.error("Booking failed. Please ensure you are logged in.");
      }
    } catch (error) {
      console.error("Booking error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-slate-50">
      <h3 className="font-bold text-lg">Request Appointment</h3>
      <div>
        <label className="block mb-1 text-sm">Preferred Date & Time</label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label className="block mb-1 text-sm">Reason for Visit</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-2 border rounded h-20"
          placeholder="Briefly describe your symptoms or needs"
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Sending...' : 'Confirm Request'}
      </Button>
    </form>
  );
}
