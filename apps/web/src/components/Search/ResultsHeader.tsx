"use client";

import { useTranslations } from "next-intl";

interface ResultsHeaderProps {
  count: number;
  location?: string;
  onSortChange: (sort: string) => void;
  currentSort: string;
}

const SORT_OPTIONS = [
  { value: "bestMatch", labelKey: "sortBestMatch" },
  { value: "distance", labelKey: "sortDistance" },
  { value: "rating", labelKey: "sortRating" },
  { value: "nextAvailable", labelKey: "sortNextAvailable" },
] as const;

export default function ResultsHeader({
  count,
  location,
  onSortChange,
  currentSort,
}: ResultsHeaderProps) {
  const t = useTranslations("Home");

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-200 mb-4">
      <p className="text-sm font-semibold text-slate-700">
        <span className="text-base font-extrabold text-slate-900">{count}</span>{" "}
        {location ? (
          <>doctors near <span className="font-bold">{location}</span></>
        ) : (
          "doctors available"
        )}
      </p>

      <div className="flex items-center gap-2">
        <label htmlFor="results-sort" className="text-xs font-medium text-slate-500 hidden sm:block">
          {t("sortLabel")}:
        </label>
        <select
          id="results-sort"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          aria-label="Sort results"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
