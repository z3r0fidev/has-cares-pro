import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "../../../../../i18n/routing";
import DirectoryProviderCard from "./DirectoryProviderCard";
import { SPECIALTIES } from "@careequity/core/src/types/index";

// ── Static data ──────────────────────────────────────────────────────────────

/** The 10 covered states: human label, two-letter code, and slug. */
export const COVERED_STATES: Array<{ label: string; code: string; slug: string }> = [
  { label: "New York", code: "NY", slug: "new-york" },
  { label: "California", code: "CA", slug: "california" },
  { label: "Texas", code: "TX", slug: "texas" },
  { label: "Florida", code: "FL", slug: "florida" },
  { label: "Illinois", code: "IL", slug: "illinois" },
  { label: "Pennsylvania", code: "PA", slug: "pennsylvania" },
  { label: "Ohio", code: "OH", slug: "ohio" },
  { label: "Georgia", code: "GA", slug: "georgia" },
  { label: "North Carolina", code: "NC", slug: "north-carolina" },
  { label: "Michigan", code: "MI", slug: "michigan" },
];

/** Convert a specialty label like "OB/GYN" to a URL-safe slug "ob-gyn". */
export function specialtyToSlug(specialty: string): string {
  return specialty
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Convert a slug back to a display label by matching against SPECIALTIES. */
function slugToSpecialty(slug: string): string | undefined {
  return SPECIALTIES.find((s) => specialtyToSlug(s) === slug);
}

/** Find a state entry by its slug. */
function slugToState(slug: string): (typeof COVERED_STATES)[number] | undefined {
  return COVERED_STATES.find((s) => s.slug === slug);
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface PageProps {
  params: Promise<{
    locale: string;
    state: string;
    specialty: string;
  }>;
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const locales = ["en", "es", "ar"];
  const params: Array<{ locale: string; state: string; specialty: string }> = [];

  for (const locale of locales) {
    for (const state of COVERED_STATES) {
      for (const specialty of SPECIALTIES) {
        params.push({
          locale,
          state: state.slug,
          specialty: specialtyToSlug(specialty),
        });
      }
    }
  }

  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, state: stateSlug, specialty: specialtySlug } = await params;

  const stateInfo = slugToState(stateSlug);
  const specialtyLabel = slugToSpecialty(specialtySlug);

  if (!stateInfo || !specialtyLabel) {
    return { title: "Directory | CareEquity" };
  }

  const title = `${specialtyLabel} Doctors in ${stateInfo.label} | CareEquity`;
  const description = `Find culturally competent ${specialtyLabel} physicians in ${stateInfo.label}. Browse minority doctors verified by CareEquity and book an appointment today.`;
  const canonicalUrl = `https://careequity.health/${locale}/directory/${stateSlug}/${specialtySlug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "CareEquity",
      type: "website",
      locale: locale === "ar" ? "ar_SA" : locale === "es" ? "es_ES" : "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@CareEquity",
    },
  };
}

// ── Data fetching ──────────────────────────────────────────────────────────────

/**
 * Fetch providers from the API at build time (SSG).
 * Falls back to an empty array on any error so the page still renders.
 */
async function fetchDirectoryProviders(
  stateCode: string,
  specialty: string
): Promise<DirectoryProvider[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  try {
    const res = await fetch(
      `${API_URL}/providers?state=${encodeURIComponent(stateCode)}&specialty=${encodeURIComponent(specialty)}&limit=20`,
      {
        // ISR: revalidate every 24 hours
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return [];
    const data: unknown = await res.json();
    return Array.isArray(data) ? (data as DirectoryProvider[]) : [];
  } catch {
    // API may not be running at build time — that is acceptable
    return [];
  }
}

// ── JSON-LD helpers ────────────────────────────────────────────────────────────

function buildJsonLd(
  providers: DirectoryProvider[],
  specialtyLabel: string,
  stateName: string
): string {
  const items = providers.map((p, index) => ({
    "@type": "MedicalBusiness",
    position: index + 1,
    name: p.name,
    medicalSpecialty: specialtyLabel,
    address: {
      "@type": "PostalAddress",
      addressLocality: p.address.city,
      addressRegion: p.address.state,
      addressCountry: "US",
    },
    url: `https://careequity.health/en/providers/${p.id}`,
  }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${specialtyLabel} Doctors in ${stateName}`,
    description: `Culturally competent ${specialtyLabel} physicians in ${stateName} verified by CareEquity.`,
    numberOfItems: providers.length,
    itemListElement: items,
  };

  return JSON.stringify(schema);
}

// ── Page component ────────────────────────────────────────────────────────────

export default async function DirectoryPage({ params }: PageProps) {
  const { locale, state: stateSlug, specialty: specialtySlug } = await params;

  const stateInfo = slugToState(stateSlug);
  const specialtyLabel = slugToSpecialty(specialtySlug);

  const t = await getTranslations({ locale, namespace: "Directory" });

  // 404-style fallback if the slug combination is invalid
  if (!stateInfo || !specialtyLabel) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-5xl font-black text-slate-200 mb-4">404</p>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Directory page not found</h1>
          <Link
            href="/"
            className="inline-block mt-4 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const providers = await fetchDirectoryProviders(stateInfo.code, specialtyLabel);
  const jsonLd = buildJsonLd(providers, specialtyLabel, stateInfo.label);

  // Build the pre-filled search URL
  const searchUrl = `/?specialty=${encodeURIComponent(specialtyLabel)}`;

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <main className="min-h-screen bg-slate-50">
        {/* ── Hero ── */}
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 py-10">
            {/* Breadcrumb */}
            <nav className="text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              {" / "}
              <span>Directory</span>
              {" / "}
              <span>{stateInfo.label}</span>
              {" / "}
              <span className="text-slate-600 font-medium">{specialtyLabel}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {t("title", { specialty: specialtyLabel, state: stateInfo.label })}
            </h1>

            <p className="mt-3 text-base text-slate-600 max-w-2xl">
              {t("subtitle", { specialty: specialtyLabel, state: stateInfo.label })}
            </p>

            {/* Link to live search */}
            <Link
              href={searchUrl}
              className="inline-block mt-5 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors shadow-sm"
            >
              {t("searchLink", { specialty: specialtyLabel })}
            </Link>
          </div>
        </section>

        {/* ── Provider list ── */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          {providers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">{t("noProviders")}</p>
              <Link
                href={searchUrl}
                className="inline-block mt-4 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors"
              >
                {t("searchLink", { specialty: specialtyLabel })}
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 mb-4">
                {providers.length} {specialtyLabel} physician
                {providers.length !== 1 ? "s" : ""} in {stateInfo.label}
              </p>

              <ul className="space-y-3" aria-label={`${specialtyLabel} providers in ${stateInfo.label}`}>
                {providers.map((provider) => (
                  <li key={provider.id}>
                    <DirectoryProviderCard provider={provider} />
                  </li>
                ))}
              </ul>

              {/* Bottom CTA */}
              <div className="mt-8 text-center">
                <Link
                  href={searchUrl}
                  className="inline-block px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors shadow-sm"
                >
                  {t("searchLink", { specialty: specialtyLabel })}
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
