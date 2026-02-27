"use client";

import { useState, useEffect } from 'react';
import HeroBanner from "../../components/Search/HeroBanner";
import HorizontalSearchBar from "../../components/Search/HorizontalSearchBar";
import ResultsList from "../../components/Search/ResultsList";
import { ProviderCardData } from "../../components/Provider/ProviderSearchCard";

// Local ZIP to Coordinate mapping for prototype regions
const ZIP_MAP: Record<string, { lat: number; lon: number }> = {
  // NYC Area
  "10001": { lat: 40.7501, lon: -73.9996 },
  "10006": { lat: 40.7082, lon: -74.0131 },
  "10013": { lat: 40.7201, lon: -74.0052 },
  "11213": { lat: 40.6711, lon: -73.9366 },
  // Philadelphia Area
  "19132": { lat: 39.9926, lon: -75.1652 },
  "19143": { lat: 39.9477, lon: -75.2224 },
  // South Jersey
  "08103": { lat: 39.9341, lon: -75.1185 },
};

export default function Home() {
  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [lastSearchParams, setLastSearchParams] = useState<{ zip: string; specialty: string; insurance: string } | null>(null);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  const handleSearch = async (filters: { zip: string; specialty: string; insurance: string }) => {
    setLoading(true);
    setHasSearched(true);
    setLastSearchParams(filters);
    if (filters.zip) setSearchLocation(filters.zip);

    try {
      const coords = ZIP_MAP[filters.zip] || { lat: 40.7128, lon: -74.0060 };
      const res = await fetch(
        `${apiUrl}/providers?lat=${coords.lat}&lon=${coords.lon}&radius=50&specialty=${filters.specialty}&insurance=${filters.insurance}`
      );
      const data = await res.json();
      setProviders(data);
    } catch (error) {
      console.error("Failed to fetch providers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceSelect = (insurance: string) => {
    const next = selectedInsurance === insurance ? '' : insurance;
    setSelectedInsurance(next);
    // Re-run the last search with the new insurance filter if results are already shown
    if (lastSearchParams) {
      handleSearch({ ...lastSearchParams, insurance: next });
    }
  };

  return (
    <main>
      {/* Hero banner with insurance pills */}
      <HeroBanner onInsuranceSelect={handleInsuranceSelect} selectedInsurance={selectedInsurance} />

      {/* Search bar */}
      <div className="container mx-auto max-w-4xl px-4 py-5">
        <HorizontalSearchBar
          onSearch={handleSearch}
          defaultInsurance={selectedInsurance}
        />
      </div>

      {/* Results */}
      {(hasSearched || loading) && (
        <div className="container mx-auto max-w-4xl px-4 pb-12">
          <ResultsList
            providers={providers}
            loading={loading}
            location={searchLocation}
          />
        </div>
      )}
    </main>
  );
}
