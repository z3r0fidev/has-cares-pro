"use client";

import { useState, useEffect } from 'react';
import SearchForm from "../../components/Search/SearchForm";
import ResultsList from "../../components/Search/ResultsList";
import { Button } from "@careequity/ui";
import { Provider } from "@careequity/core";
import { useTranslations } from 'next-intl';

// Local ZIP to Coordinate mapping for prototype regions
const ZIP_MAP: Record<string, { lat: number; lon: number }> = {
  // NYC Area
  "10001": { lat: 40.7501, lon: -73.9996 },
  "10006": { lat: 40.7082, lon: -74.0131 },
  "10013": { lat: 40.7201, lon: -74.0052 },
  "11213": { lat: 40.6711, lon: -73.9366 },
  // Philadelphia Area
  "19132": { lat: 39.9926, lon: -75.1652 }, // Dr. Ala Stanford area
  "19143": { lat: 39.9477, lon: -75.2224 },
  // South Jersey
  "08103": { lat: 39.9341, lon: -75.1185 }, // Dr. Sarah Miller area
};

export default function Home() {
  const t = useTranslations('Home');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  const handleSearch = async (filters: { zip: string; specialty: string; insurance: string }) => {
    setLoading(true);
    try {
      const coords = ZIP_MAP[filters.zip] || { lat: 40.7128, lon: -74.0060 };
      
      const res = await fetch(`${apiUrl}/providers?lat=${coords.lat}&lon=${coords.lon}&radius=50&specialty=${filters.specialty}&insurance=${filters.insurance}`);
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">{t('title')}</h1>
        <p className="text-xl text-slate-500">{t('subtitle')}</p>
      </div>
      
      <div className="mb-8">
        <Button onClick={() => alert("Checking System status")}>
          {t('statusCheck')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <SearchForm onSearch={handleSearch} />
        </div>
        <div className="md:col-span-2">
          {loading ? (
            <div className="flex justify-center p-12">
              <p className="animate-pulse text-xl text-slate-400 font-medium">{t('loading')}</p>
            </div>
          ) : (
            <ResultsList providers={providers} />
          )}
        </div>
      </div>
    </main>
  );
}
