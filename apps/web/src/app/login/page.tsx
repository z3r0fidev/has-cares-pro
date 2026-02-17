"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@careequity/ui";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user_role', data.user.role);
        
        // Role-based redirection
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/portal/dashboard');
        }
      } else {
        const err = await res.json();
        alert(`Login failed: ${err.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error("Login request failed", error);
      alert(`Could not connect to authentication server at ${apiUrl}. Please ensure the API is running.`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50" suppressHydrationWarning>
      <form onSubmit={handleLogin} className="w-full max-w-md p-8 bg-white rounded-lg shadow-md" suppressHydrationWarning>
        <h1 className="text-2xl font-bold mb-6 text-slate-900 text-center">Platform Login</h1>
        <div className="mb-4" suppressHydrationWarning>
          <label className="block mb-2 text-sm font-medium text-slate-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary text-slate-900"
            required
            suppressHydrationWarning
          />
        </div>
        <div className="mb-6" suppressHydrationWarning>
          <label className="block mb-2 text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-primary text-slate-900"
            required
            suppressHydrationWarning
          />
        </div>
        <Button className="w-full" type="submit">Log In</Button>
        <div className="mt-6 p-4 bg-slate-50 rounded text-xs text-slate-500 space-y-1">
          <p><span className="font-bold">Admin:</span> admin@careequity.com / admin123</p>
          <p><span className="font-bold">Physician:</span> drjoserodriguez@example.com / password123</p>
        </div>
      </form>
    </div>
  );
}
