"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NO_LOGO_SET, getLocalLogoPath, getClearbitLogoUrl, getFallbackConfig } from '@/lib/insuranceLogos';

interface InsuranceLogoProps {
  /** Canonical insurer name, e.g. "Aetna" or "BlueCross BlueShield" */
  name: string;
  /** Side length in pixels for the square container. Defaults to 16. */
  size?: number;
}

/**
 * Renders an insurer logo with a brand-colored initials fallback.
 *
 * Rendering strategy:
 * 1. Government programs (NO_LOGO_SET) and unknown insurers: initials only, no img request.
 * 2. Known insurers: initials rendered as the base layer, Clearbit img loaded on top.
 *    On load success: img fades in (150ms), covering the initials.
 *    On load error: img is discarded, initials remain permanently visible.
 *
 * The container is aria-hidden="true" — all accessible context comes from the parent element.
 */
export default function InsuranceLogo({ name, size = 16 }: InsuranceLogoProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const fallback = getFallbackConfig(name);
  const logoUrl = getLocalLogoPath(name) ?? getClearbitLogoUrl(name);
  const shouldAttemptLogo = logoUrl !== null && !NO_LOGO_SET.has(name);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: fallback.bg,
    color: fallback.text,
    fontSize: Math.max(6, Math.floor(size * 0.42)),
    flexShrink: 0,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center overflow-hidden rounded-sm',
        'relative select-none font-semibold leading-none'
      )}
      style={containerStyle}
      aria-hidden="true"
    >
      {/* Initials — always rendered as the base layer */}
      <span className="z-0 pointer-events-none">
        {fallback.initials}
      </span>

      {/* Logo img — only mounted when a domain is configured and not errored */}
      {shouldAttemptLogo && !errored && (
        <img
          src={logoUrl}
          alt=""
          aria-hidden="true"
          width={size}
          height={size}
          className={cn(
            'absolute inset-0 w-full h-full object-contain z-10',
            'transition-opacity duration-150',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </span>
  );
}
