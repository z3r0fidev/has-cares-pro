"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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

function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [providers, setProviders] = useState<ProviderCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [radius, setRadius] = useState(50);
  const [apiUrl, setApiUrl] = useState('http://localhost:3001');

  // Initial URL param values for pre-populating the search bar
  const [initZip, setInitZip] = useState('');
  const [initSpecialty, setInitSpecialty] = useState('');
  const [initInsurance, setInitInsurance] = useState('');
  const [initRadius, setInitRadius] = useState(50);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      setApiUrl(`http://${hostname}:3001`);
    }
  }, []);

  // On mount: read URL params and auto-trigger search if any present
  useEffect(() => {
    const zip = searchParams.get('zip') ?? '';
    const specialty = searchParams.get('specialty') ?? '';
    const insurance = searchParams.get('insurance') ?? '';
    const rad = parseInt(searchParams.get('radius') ?? '50', 10);

    setInitZip(zip);
    setInitSpecialty(specialty);
    setInitInsurance(insurance);
    setInitRadius(rad);
    setSelectedInsurance(insurance);
    setRadius(rad);

    if (zip || specialty || insurance) {
      handleSearch({ zip, specialty, insurance, radius: rad });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const handleSearch = async (filters: { zip: string; specialty: string; insurance: string; radius: number }) => {
    setLoading(true);
    setHasSearched(true);
    setRadius(filters.radius);
    if (filters.zip) setSearchLocation(filters.zip);

    // Update URL params
    const params = new URLSearchParams();
    if (filters.zip) params.set('zip', filters.zip);
    if (filters.specialty) params.set('specialty', filters.specialty);
    if (filters.insurance) params.set('insurance', filters.insurance);
    params.set('radius', String(filters.radius));
    router.replace(`${pathname}?${params.toString()}`);

    try {
      const coords = ZIP_MAP[filters.zip] || { lat: 40.7128, lon: -74.0060 };
      const res = await fetch(
        `${apiUrl}/providers?lat=${coords.lat}&lon=${coords.lon}&radius=${filters.radius}&specialty=${filters.specialty}&insurance=${filters.insurance}`
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
    // Re-run last search with new insurance filter if already showing results
    if (hasSearched) {
      handleSearch({ zip: initZip || searchLocation, specialty: initSpecialty, insurance: next, radius });
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
          defaultZip={initZip}
          defaultSpecialty={initSpecialty}
          defaultRadius={initRadius}
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

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
