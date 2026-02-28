import { Link } from "../../../../../i18n/routing";
import { MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface DirectoryProvider {
  id: string;
  name: string;
  specialties: string[];
  verification_tier: number;
  address: {
    city: string;
    state: string;
  };
}

interface DirectoryProviderCardProps {
  provider: DirectoryProvider;
}

const TIER_LABEL: Record<number, string> = {
  1: "NPI Verified",
  2: "Identity Verified",
  3: "Practice Verified",
};

const TIER_CLASSES: Record<number, string> = {
  1: "bg-blue-50 text-blue-700 border-blue-200",
  2: "bg-indigo-50 text-indigo-700 border-indigo-200",
  3: "bg-green-50 text-green-700 border-green-200",
};

export default function DirectoryProviderCard({ provider }: DirectoryProviderCardProps) {
  const initial = provider.name.charAt(0).toUpperCase();
  const tierLabel = TIER_LABEL[provider.verification_tier];
  const tierClasses = TIER_CLASSES[provider.verification_tier];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all flex items-start gap-4">
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex-shrink-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <span className="text-lg font-bold text-primary">{initial}</span>
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0">
        <h3 className="text-base font-bold text-slate-900 truncate">{provider.name}</h3>

        <p className="text-sm text-slate-500 mt-0.5 truncate">
          {provider.specialties.join(", ")}
        </p>

        <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-500">
          <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          <span>
            {provider.address.city}, {provider.address.state}
          </span>
        </div>

        {tierLabel && (
          <span
            className={cn(
              "inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              tierClasses
            )}
          >
            <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" strokeWidth={2.5} />
            {tierLabel}
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/providers/${provider.id}`}
        className="flex-shrink-0 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:bg-[oklch(0.78_0.17_84.429)] transition-colors whitespace-nowrap"
        aria-label={`View profile for ${provider.name}`}
      >
        View Profile
      </Link>
    </div>
  );
}
