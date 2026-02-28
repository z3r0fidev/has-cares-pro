"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { ProviderCardData } from "../Provider/ProviderSearchCard";

// Tier label map mirroring Badge.tsx so we don't import a client component here
const TIER_LABELS: Record<number, string> = {
  1: "NPI Verified",
  2: "Identity Verified",
  3: "Practice Verified",
};

interface MapViewProps {
  providers: ProviderCardData[];
  onProviderSelect: (id: string) => void;
}

/**
 * Compute the geographic centroid of a set of providers that carry lat/lon.
 * Falls back to the geographic center of the contiguous US when the list is
 * empty or no provider has location data.
 */
function computeCentroid(
  providers: Array<ProviderCardData & { location?: { lat: number; lon: number } }>
): [number, number] {
  const located = providers.filter((p) => p.location?.lat && p.location?.lon);
  if (located.length === 0) return [39.5, -98.35];
  const avgLat = located.reduce((s, p) => s + p.location!.lat, 0) / located.length;
  const avgLon = located.reduce((s, p) => s + p.location!.lon, 0) / located.length;
  return [avgLat, avgLon];
}

/**
 * MapView renders an interactive Leaflet map for the provider search results.
 *
 * Leaflet requires the DOM (window) to be available, so this component must
 * only ever be rendered client-side. The parent page imports it via
 * `next/dynamic` with `{ ssr: false }`.
 *
 * Known Next.js / Leaflet gotcha: the default marker icon references asset
 * paths that webpack bundles incorrectly. We override them with unpkg CDN
 * URLs so pins always render correctly.
 */
export default function MapView({ providers, onProviderSelect }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to the map instance so we can destroy it on unmount and avoid
  // "map container is already initialized" errors on React strict-mode double
  // invocations.
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mapContainerRef.current) return;

    // Dynamic import keeps Leaflet out of the SSR bundle entirely.
    import("leaflet").then((L) => {
      // Guard: if the container was already initialized (React strict-mode
      // double-invocation), remove the old map first.
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Fix broken default marker icons under webpack/Next.js
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Cast providers so TypeScript accepts the optional location field that
      // the full Provider interface has but ProviderCardData doesn't declare.
      const typed = providers as Array<
        ProviderCardData & { location?: { lat: number; lon: number } }
      >;

      const center = computeCentroid(typed);
      const zoom = typed.filter((p) => p.location?.lat).length > 0 ? 11 : 4;

      const map = L.map(mapContainerRef.current!, {
        center,
        zoom,
        scrollWheelZoom: false,
      });

      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      typed.forEach((provider) => {
        if (!provider.location?.lat || !provider.location?.lon) return;

        const tierLabel = TIER_LABELS[provider.verification_tier] ?? "";
        const specialty = provider.specialties.join(", ");
        const address = `${provider.address.city}, ${provider.address.state}`;

        const popupHtml = `
          <div style="min-width:180px;font-family:system-ui,sans-serif">
            <p style="margin:0 0 2px;font-weight:700;font-size:14px;color:#0f172a">
              ${provider.name}
            </p>
            <p style="margin:0 0 2px;font-size:12px;color:#64748b">${specialty}</p>
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8">${address}</p>
            ${
              tierLabel
                ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#dbeafe;color:#1e40af;font-size:10px;font-weight:700;margin-bottom:8px">${tierLabel}</span>`
                : ""
            }
            <br/>
            <button
              id="map-select-${provider.id}"
              style="display:inline-block;padding:6px 14px;background:#F5BE00;color:#0f172a;font-weight:700;font-size:12px;border:none;border-radius:8px;cursor:pointer;margin-top:4px"
            >
              View Profile
            </button>
          </div>
        `;

        const marker = L.marker([provider.location.lat, provider.location.lon]);
        marker.bindPopup(popupHtml);
        marker.addTo(map);

        // Wire up the "View Profile" button inside the popup after it opens.
        marker.on("popupopen", () => {
          const btn = document.getElementById(`map-select-${provider.id}`);
          if (btn) {
            btn.addEventListener("click", () => onProviderSelect(provider.id));
          }
        });
      });

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    });

    // Cleanup for React strict-mode / unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [providers]);

  return (
    <div
      ref={mapContainerRef}
      className="h-[520px] w-full rounded-xl overflow-hidden shadow"
      aria-label="Map of provider locations"
      role="img"
    />
  );
}
