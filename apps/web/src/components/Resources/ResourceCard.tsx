import { Link } from "../../i18n/routing";
import { BookOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResourceArticle } from "../../content/resources/types";

/** Maps specialty labels to background accent classes for the card header. */
const SPECIALTY_ACCENT: Record<string, string> = {
  Cardiology: "bg-red-50 border-red-100 text-red-700",
  Endocrinology: "bg-amber-50 border-amber-100 text-amber-700",
  Psychiatry: "bg-violet-50 border-violet-100 text-violet-700",
};

const DEFAULT_ACCENT = "bg-slate-50 border-slate-100 text-slate-700";

interface ResourceCardProps {
  article: ResourceArticle;
  locale: string;
  readMoreLabel: string;
}

export default function ResourceCard({
  article,
  locale,
  readMoreLabel,
}: ResourceCardProps) {
  const isAr = locale === "ar";
  const isEs = locale === "es";

  const displayTitle = isAr ? article.titleAr : isEs ? article.titleEs : article.title;
  const displaySummary = isAr
    ? article.summaryAr
    : isEs
    ? article.summaryEs
    : article.summary;

  const accentClasses = SPECIALTY_ACCENT[article.specialty] ?? DEFAULT_ACCENT;

  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    locale === "ar" ? "ar-SA" : locale === "es" ? "es-ES" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <article
      className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
      aria-label={displayTitle}
    >
      {/* Specialty header strip */}
      <div
        className={cn(
          "flex items-center gap-2 px-5 py-3 border-b text-xs font-semibold",
          accentClasses
        )}
      >
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        <span>{article.specialty}</span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-grow p-5">
        <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
          {displayTitle}
        </h2>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-3 flex-grow">
          {displaySummary}
        </p>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <time
            dateTime={article.publishedAt}
            className="text-xs text-slate-400"
          >
            {formattedDate}
          </time>

          <Link
            href={`/resources/${article.slug}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[oklch(0.78_0.17_84.429)] transition-colors"
            aria-label={`Read full article: ${displayTitle}`}
          >
            {readMoreLabel}
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
