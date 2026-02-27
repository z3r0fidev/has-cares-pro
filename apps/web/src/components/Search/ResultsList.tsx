"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import ProviderSearchCard, { ProviderCardData } from "../Provider/ProviderSearchCard";
import { ProviderListSkeleton } from "../Provider/ProviderCardSkeleton";
import ResultsHeader from "./ResultsHeader";

interface ResultsListProps {
  providers: ProviderCardData[];
  loading?: boolean;
  location?: string;
}

function sortProviders(providers: ProviderCardData[], sort: string): ProviderCardData[] {
  const sorted = [...providers];
  switch (sort) {
    case "rating":
      return sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    case "distance":
      return sorted.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
    case "nextAvailable":
      return sorted.sort((a, b) => {
        if (!a.nextAvailable) return 1;
        if (!b.nextAvailable) return -1;
        return new Date(a.nextAvailable).getTime() - new Date(b.nextAvailable).getTime();
      });
    default:
      return sorted;
  }
}

export default function ResultsList({ providers, loading, location }: ResultsListProps) {
  const t = useTranslations("Home");
  const [sort, setSort] = useState("bestMatch");

  if (loading) {
    return <ProviderListSkeleton />;
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center" role="status">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <SearchX className="text-slate-400" size={28} aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">{t("noResults")}</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Try expanding your search radius, removing a filter, or searching in a nearby city.
        </p>
      </div>
    );
  }

  const sorted = sortProviders(providers, sort);

  return (
    <div>
      <ResultsHeader
        count={providers.length}
        location={location}
        onSortChange={setSort}
        currentSort={sort}
      />
      <ul className="space-y-4" role="list" aria-label="Search results">
        {sorted.map((provider, index) => (
          <ProviderSearchCard key={`${provider.id}-${index}`} provider={provider} />
        ))}
      </ul>
    </div>
  );
}
