"use client";

import Link from 'next/link';

interface ResultsListProps {
  providers: Array<{
    id: string;
    name: string;
    specialties: string[];
    location: { lat: number; lon: number };
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    verification_tier: number;
    profile_image_url?: string;
  }>;
}

export default function ResultsList({ providers }: ResultsListProps) {
  if (!providers || providers.length === 0) {
    return <p className="text-muted-foreground italic">No physicians found matching your criteria.</p>;
  }

  return (
    <div className="grid gap-6">
      {providers.map((provider) => {
        const fullAddress = `${provider.address.street}, ${provider.address.city}, ${provider.address.state} ${provider.address.zip}`;
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
        
        return (
          <div key={provider.id} className="p-6 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow flex gap-6">
            {/* Profile Picture Placeholder */}
            <div className="w-20 h-20 rounded-full bg-muted flex-shrink-0 overflow-hidden border">
              {provider.profile_image_url ? (
                <img 
                  src={provider.profile_image_url} 
                  alt={provider.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold text-xl">
                  {provider.name.charAt(4)}
                </div>
              )}
            </div>

            <div className="flex-grow flex flex-col md:flex-row gap-6">
              <div className="flex-grow">
                <Link href={`/providers/${provider.id}`}>
                  <h3 className="text-2xl font-bold hover:text-primary transition-colors cursor-pointer">
                    {provider.name}
                  </h3>
                </Link>
                <p className="text-lg font-medium text-muted-foreground">{provider.specialties.join(', ')}</p>
                
                <div className="mt-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    provider.verification_tier === 3 ? 'bg-green-100 text-green-800' :
                    provider.verification_tier === 2 ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Tier {provider.verification_tier} Verified
                  </span>
                </div>
              </div>

              {/* Clickable Map Placeholder */}
              <div className="w-full md:w-48 h-32 rounded border overflow-hidden relative group cursor-pointer">
                <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <span className="bg-white/90 px-3 py-1 rounded text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Get Directions
                    </span>
                  </div>
                  {/* Static Map Placeholder - In production, use Google Static Maps API */}
                  <div className="w-full h-full bg-slate-200 flex flex-col items-center justify-center p-2 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Map View</p>
                    <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{fullAddress}</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
