/**
 * Insurance logo configuration for CareEquity.
 *
 * Logos are sourced from the Clearbit Logo API (logo.clearbit.com).
 * Government programs (Medicare, Medicaid) have no corporate domain
 * and are excluded from logo lookups — they always render the initials fallback.
 */

export type InsuranceFallbackConfig = {
  bg: string;
  text: string;
  initials: string;
};

/**
 * Insurers that have no Clearbit-resolvable domain.
 * These always render the initials fallback without attempting an img load.
 */
export const NO_LOGO_SET = new Set<string>([
  'Medicare',
  'Medicaid',
]);

/**
 * Maps a canonical insurer name to its Clearbit domain.
 * Only insurers with a reliable public logo domain are included.
 */
export const INSURER_DOMAIN_MAP: Record<string, string> = {
  'Aetna': 'aetna.com',
  'BlueCross BlueShield': 'bcbs.com',
  'Cigna': 'cigna.com',
  'Humana': 'humana.com',
  'UnitedHealthcare': 'uhc.com',
  'Kaiser Permanente': 'kaiserpermanente.org',
};

/**
 * Brand-matched fallback colors and initials for each insurer.
 * Used as the always-visible base layer before a logo resolves,
 * and as the permanent render for NO_LOGO_SET members.
 */
export const INSURER_FALLBACK_CONFIG: Record<string, InsuranceFallbackConfig> = {
  'Aetna': { bg: '#FEF3C7', text: '#92400E', initials: 'AE' },
  'BlueCross BlueShield': { bg: '#EFF6FF', text: '#1D4ED8', initials: 'BC' },
  'Cigna': { bg: '#EFF6FF', text: '#1E40AF', initials: 'CI' },
  'Humana': { bg: '#FDF2F8', text: '#9D174D', initials: 'HU' },
  'Medicare': { bg: '#EFF6FF', text: '#1D4ED8', initials: 'MC' },
  'Medicaid': { bg: '#F0FDF4', text: '#15803D', initials: 'MD' },
  'UnitedHealthcare': { bg: '#FFF7ED', text: '#9A3412', initials: 'UH' },
  'Kaiser Permanente': { bg: '#F0FDF4', text: '#166534', initials: 'KP' },
};

/** Derives a Clearbit logo URL from a canonical insurer name, or null if unavailable. */
export function getClearbitLogoUrl(name: string): string | null {
  const domain = INSURER_DOMAIN_MAP[name];
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

/** Returns the fallback config for a given insurer name, with a generic default. */
export function getFallbackConfig(name: string): InsuranceFallbackConfig {
  if (INSURER_FALLBACK_CONFIG[name]) {
    return INSURER_FALLBACK_CONFIG[name];
  }
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return { bg: '#F8FAFC', text: '#475569', initials };
}
