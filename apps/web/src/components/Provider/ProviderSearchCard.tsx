"use client";

import Link from "next/link";
import { MapPin, Clock, Video } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from "./Badge";
import StarRating from "./StarRating";
import { trackEvent, EventType } from "../../lib/analytics";

export interface ProviderCardData {
  id: string;
  name: string;
  credentials?: string[];
  specialties: string[];
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  verification_tier: number;
  profile_image_url?: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  identity_tags?: string[];
  telehealth_url?: string;
  nextAvailable?: string;
  availableSlots?: Array<{ date: string; times: string[] }>;
}

interface ProviderSearchCardProps {
  provider: ProviderCardData;
}

// Demo slots shown when real availability data isn't present yet
function getDemoSlots() {
  const today = new Date();
  const slots = [];
  for (let i = 1; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekends
    slots.push({
      date: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      times: ["9:00 AM", "11:30 AM"],
    });
    if (slots.length === 2) break;
  }
  return slots;
}

export default function ProviderSearchCard({ provider }: ProviderSearchCardProps) {
  const slots = provider.availableSlots?.length ? provider.availableSlots : getDemoSlots();
  const firstInitial = provider.name.charAt(0).toUpperCase();
  const credentialSuffix = provider.credentials?.join(", ");
  const displayName = credentialSuffix
    ? `${provider.name}, ${credentialSuffix}`
    : provider.name;

  return (
    <li className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex gap-5">
      {/* Zone 1: Avatar + verification badge */}
      <div className="relative flex-shrink-0">
        <Link
          href={`/providers/${provider.id}`}
          onClick={() => trackEvent(provider.id, EventType.PROFILE_VIEW)}
          tabIndex={-1}
          aria-hidden="true"
        >
          <Avatar className="w-20 h-20 border-2 border-slate-100">
            <AvatarImage
              src={provider.profile_image_url}
              alt={`Professional headshot of ${provider.name}`}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold bg-slate-200 text-slate-600">
              {firstInitial}
            </AvatarFallback>
          </Avatar>
        </Link>
        {/* Verification badge overlay */}
        <div className="absolute -bottom-1 -right-1">
          <VerificationBadge tier={provider.verification_tier} size="sm" />
        </div>
      </div>

      {/* Zone 2 + Zone 3 wrapper */}
      <div className="flex-grow flex flex-col md:flex-row gap-4 min-w-0">
        {/* Zone 2: Provider info */}
        <div className="flex-grow min-w-0">
          <Link
            href={`/providers/${provider.id}`}
            onClick={() => trackEvent(provider.id, EventType.PROFILE_VIEW)}
            className="group"
            aria-label={`View full profile for ${provider.name}`}
          >
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
              {displayName}
            </h3>
          </Link>

          <p className="text-sm font-medium text-slate-500 mt-0.5">
            {provider.specialties.join(", ")}
          </p>

          {/* Star rating */}
          {provider.rating !== undefined && (
            <div className="mt-2">
              <StarRating rating={provider.rating} count={provider.reviewCount} size="sm" />
            </div>
          )}

          {/* Location */}
          <div className="flex items-center gap-1 mt-2 text-sm text-slate-500">
            <MapPin size={13} className="flex-shrink-0" aria-hidden="true" />
            <span className="truncate">
              {provider.address.city}, {provider.address.state}
              {provider.distance !== undefined && (
                <span className="ml-1 text-slate-400">· {provider.distance.toFixed(1)} mi</span>
              )}
            </span>
          </div>

          {/* Cultural identity tags */}
          {provider.identity_tags && provider.identity_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.identity_tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Zone 3: Availability slots */}
        <div className="flex-shrink-0 w-full md:w-52 space-y-2">
          {provider.nextAvailable && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 w-fit">
              <Clock size={11} aria-hidden="true" />
              Next: {provider.nextAvailable}
            </div>
          )}

          {provider.telehealth_url && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[#1A73E8] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 w-fit">
              <Video className="w-3 h-3" aria-hidden="true" />
              Telehealth
            </span>
          )}

          {slots.length > 0 ? (
            <div className="space-y-1.5">
              {slots.map((slot, si) => (
                <div key={si}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    {slot.date}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {slot.times.map((time) => (
                      <Link
                        key={time}
                        href={`/providers/${provider.id}?date=${encodeURIComponent(slot.date)}&time=${encodeURIComponent(time)}`}
                        className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
                        aria-label={`Book ${time} on ${slot.date} with ${provider.name}`}
                      >
                        {time}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}

              <Link
                href={`/providers/${provider.id}`}
                className="block text-xs font-semibold text-primary hover:underline mt-1"
              >
                See all times →
              </Link>
            </div>
          ) : (
            <Link
              href={`/providers/${provider.id}`}
              className="block w-full py-2 text-center text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
            >
              Book Appointment
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
