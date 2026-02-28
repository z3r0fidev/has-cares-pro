import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "../../../../i18n/routing";
import { ALL_ARTICLES, getArticleBySlug } from "../../../../content/resources";
import { ArrowLeft, Share2, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  const locales = ["en", "es", "ar"];
  const params: Array<{ locale: string; slug: string }> = [];

  for (const locale of locales) {
    for (const article of ALL_ARTICLES) {
      params.push({ locale, slug: article.slug });
    }
  }

  return params;
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) return { title: "Article Not Found | CareEquity" };

  const isAr = locale === "ar";
  const isEs = locale === "es";

  const title = isAr ? article.titleAr : isEs ? article.titleEs : article.title;
  const description = isAr
    ? article.summaryAr
    : isEs
    ? article.summaryEs
    : article.summary;

  const canonicalUrl = `https://careequity.health/${locale}/resources/${slug}`;

  return {
    title: `${title} | CareEquity`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${title} | CareEquity`,
      description,
      url: canonicalUrl,
      siteName: "CareEquity",
      type: "article",
      publishedTime: article.publishedAt,
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

// ── JSON-LD ───────────────────────────────────────────────────────────────────

function buildArticleJsonLd(
  locale: string,
  slug: string,
  title: string,
  description: string,
  publishedAt: string,
  specialty: string
): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    datePublished: publishedAt,
    dateModified: publishedAt,
    author: {
      "@type": "Organization",
      name: "CareEquity",
      url: "https://careequity.health",
    },
    publisher: {
      "@type": "Organization",
      name: "CareEquity",
      url: "https://careequity.health",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://careequity.health/${locale}/resources/${slug}`,
    },
    about: {
      "@type": "MedicalCondition",
      name: specialty,
    },
    inLanguage: locale === "ar" ? "ar" : locale === "es" ? "es" : "en",
  };

  return JSON.stringify(schema);
}

// ── Body renderer ──────────────────────────────────────────────────────────────

/**
 * Renders a plain-text article body where paragraphs are separated by `\n\n`
 * and **bold** sections use markdown-style `**text**` syntax.
 *
 * This avoids a full markdown parser dependency while still supporting
 * the minimal formatting used in the seed articles.
 */
function ArticleBody({ body }: { body: string }) {
  const paragraphs = body.split("\n\n").filter(Boolean);

  return (
    <div className="prose prose-slate max-w-none">
      {paragraphs.map((para, i) => {
        // Detect heading-style paragraphs that start with **…**
        const headingMatch = para.match(/^\*\*(.+?)\*\*$/);
        if (headingMatch) {
          return (
            <h3
              key={i}
              className="text-lg font-bold text-slate-800 mt-6 mb-2"
            >
              {headingMatch[1]}
            </h3>
          );
        }

        // Inline bold: split on **…** tokens
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-sm text-slate-700 leading-relaxed mb-4">
            {parts.map((part, j) => {
              const boldMatch = part.match(/^\*\*(.+)\*\*$/);
              if (boldMatch) {
                return <strong key={j}>{boldMatch[1]}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ResourceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) notFound();

  const isAr = locale === "ar";
  const isEs = locale === "es";

  const title = isAr ? article.titleAr : isEs ? article.titleEs : article.title;
  const body = isAr ? article.bodyAr : isEs ? article.bodyEs : article.body;

  const t = await getTranslations({ locale, namespace: "Resources" });

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    locale === "ar" ? "ar-SA" : locale === "es" ? "es-ES" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  const jsonLd = buildArticleJsonLd(locale, slug, title, article.summary, article.publishedAt, article.specialty);

  // Build related search URL
  const searchUrl = `/?specialty=${encodeURIComponent(article.specialty)}`;

  // Build share URL
  const shareUrl = `https://careequity.health/${locale}/resources/${slug}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <main className="min-h-screen bg-slate-50">
        {/* ── Sticky header strip ── */}
        <div className="bg-white border-b">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href="/resources"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t("backToResources")}
            </Link>

            {/* Share button — client behaviour handled by native Web Share API via a plain anchor */}
            <a
              href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
              aria-label="Share this article by email"
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
              {t("share")}
            </a>
          </div>
        </div>

        {/* ── Article container ── */}
        <article className="max-w-3xl mx-auto px-4 py-8" dir={isAr ? "rtl" : "ltr"}>
          {/* Specialty badge */}
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              {article.specialty}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-snug">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 mb-8">
            <time
              dateTime={article.publishedAt}
              className="text-xs text-slate-400"
            >
              {formattedDate}
            </time>
            <span className="text-slate-200">·</span>
            <span className="text-xs text-slate-400">CareEquity Editorial Team</span>
          </div>

          {/* Body */}
          <ArticleBody body={body} />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-8 pt-6 border-t border-slate-100">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* ── Related providers CTA ── */}
          <div className="mt-10 p-6 bg-white rounded-xl border border-primary/20 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-1">
              {t("relatedProviders")}
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Find culturally competent {article.specialty} physicians near you.
            </p>
            <Link
              href={searchUrl}
              className="inline-block px-5 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors shadow-sm"
            >
              Search {article.specialty} Physicians
            </Link>
          </div>

          {/* ── Share buttons ── */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">{t("share")}:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#1DA1F2] hover:underline"
              aria-label="Share on Twitter"
            >
              Twitter / X
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#1877F2] hover:underline"
              aria-label="Share on Facebook"
            >
              Facebook
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`}
              className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
              aria-label="Share via email"
            >
              Email
            </a>
          </div>
        </article>
      </main>
    </>
  );
}
