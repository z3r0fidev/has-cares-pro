"use client";

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { List, Map as MapIcon } from 'lucide-react';
import HeroBanner from "../../components/Search/HeroBanner";
import HorizontalSearchBar from "../../components/Search/HorizontalSearchBar";
import ResultsList from "../../components/Search/ResultsList";
import { ProviderCardData } from "../../components/Provider/ProviderSearchCard";

// Dynamic import with ssr:false because Leaflet requires window
const MapView = dynamic(
  () => import("../../components/Search/MapView"),
  { ssr: false, loading: () => (
    <div className="h-[520px] w-full rounded-xl overflow-hidden shadow bg-slate-100 flex items-center justify-center">
      <span className="text-sm text-slate-500">Loading map…</span>
    </div>
  )}
);

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
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Initial URL param values for pre-populating the search bar
  const [initZip, setInitZip] = useState('');
  const [initSpecialty, setInitSpecialty] = useState('');
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
    setInitRadius(rad);
    setSelectedInsurance(insurance);
    setRadius(rad);

    if (zip || specialty || insurance) {
      handleSearch({ zip, specialty, insurance, radius: rad });
    }
  }, []); // run once on mount — intentional, handleSearch captured at mount

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

  const handleAddInsuranceClick = () => {
    const el = document.getElementById('search-insurance');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLSelectElement).focus();
  };

  const handleProviderSelect = (id: string) => {
    // pathname for the home page is "/en" (or "/es", "/ar").
    // Extract the locale segment so the navigation respects i18n prefixes.
    const localeSegment = pathname.split('/')[1] ?? 'en';
    router.push(`/${localeSegment}/providers/${id}`);
  };

  return (
    <main>
      {/* Hero banner with insurance pills */}
      <HeroBanner onInsuranceSelect={handleInsuranceSelect} selectedInsurance={selectedInsurance} onAddInsuranceClick={handleAddInsuranceClick} />

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
          {/* List / Map toggle — only shown when there are results */}
          {!loading && providers.length > 0 && (
            <div className="flex gap-2 mb-4" role="group" aria-label="Results view">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#F5BE00] text-slate-900 border-[#F5BE00] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                aria-pressed={viewMode === 'list'}
              >
                <List size={15} aria-hidden="true" />
                List
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  viewMode === 'map'
                    ? 'bg-[#F5BE00] text-slate-900 border-[#F5BE00] shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                aria-pressed={viewMode === 'map'}
              >
                <MapIcon size={15} aria-hidden="true" />
                Map
              </button>
            </div>
          )}

          {viewMode === 'list' || loading ? (
            <ResultsList
              providers={providers}
              loading={loading}
              location={searchLocation}
            />
          ) : (
            <MapView
              providers={providers}
              onProviderSelect={handleProviderSelect}
            />
          )}
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
