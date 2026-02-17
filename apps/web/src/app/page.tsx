"use client";

import { useState, useEffect } from 'react';
import SearchForm from "../components/Search/SearchForm";
import ResultsList from "../components/Search/ResultsList";
import { Button } from "@careequity/ui";

export default function Home() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');

  useEffect(() => {
    // Set API URL based on current hostname to prevent "Failed to fetch" on different networks
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  const handleSearch = async (filters: { zip: string; specialty: string }) => {
    setLoading(true);
    try {
      // In real app, convert ZIP to Lat/Lon
      const lat = 40.7128; 
      const lon = -74.0060;
      
      const res = await fetch(`${apiUrl}/providers?lat=${lat}&lon=${lon}&specialty=${filters.specialty}`);
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers", error);
      alert("Failed to connect to the API. Please ensure the backend is running on port 3001.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Find a Physician</h1>
      
      <div className="mb-8">
        <Button onClick={() => alert("Shared component working!")}>Shared Button Example</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <SearchForm onSearch={handleSearch} />
        </div>
        <div className="md:col-span-2">
          {loading ? <p>Loading providers...</p> : <ResultsList providers={providers} />}
        </div>
      </div>
    </main>
  );
}
