import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ALL_ARTICLES } from "../../../content/resources";
import ResourceCard from "../../../components/Resources/ResourceCard";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ specialty?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  const title = "Community Health Resources | CareEquity";
  const description =
    "Culturally relevant health education articles for Black, Latino, and Arab American communities — covering cardiology, diabetes, mental health, and more.";
  const canonicalUrl = `https://careequity.health/${locale}/resources`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "CareEquity",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      site: "@CareEquity",
    },
  };
}

/**
 * The resources hub lists all community health articles with optional
 * specialty filtering via a query-string parameter (`?specialty=Cardiology`).
 *
 * This is a Server Component — filtering happens at render time without
 * any client-side JavaScript.
 */
export default async function ResourcesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { specialty: filterSpecialty } = await searchParams;

  const t = await getTranslations({ locale, namespace: "Resources" });

  const filtered = filterSpecialty
    ? ALL_ARTICLES.filter((a) => a.specialty === filterSpecialty)
    : ALL_ARTICLES;

  // Specialties that actually have articles
  const availableSpecialties = Array.from(new Set(ALL_ARTICLES.map((a) => a.specialty)));

  return (
    <main className="min-h-screen bg-slate-50">
      {/* ── Hero ── */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            {t("title")}
          </h1>
          <p className="mt-3 text-base text-slate-600 max-w-2xl">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ── Filters ── */}
      <section className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs font-semibold text-slate-500 flex-shrink-0 mr-1">
            {t("filterBySpecialty")}:
          </span>

          {/* "All" pill */}
          <a
            href={`/${locale}/resources`}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              !filterSpecialty
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
            }`}
          >
            All
          </a>

          {availableSpecialties.map((spec) => (
            <a
              key={spec}
              href={`/${locale}/resources?specialty=${encodeURIComponent(spec)}`}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filterSpecialty === spec
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
              }`}
            >
              {spec}
            </a>
          ))}
        </div>
      </section>

      {/* ── Article grid ── */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-16">
            {t("noArticles")}
          </p>
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-label="Community health articles"
          >
            {filtered.map((article) => (
              <li key={article.slug}>
                <ResourceCard
                  article={article}
                  locale={locale}
                  readMoreLabel={t("readMore")}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
