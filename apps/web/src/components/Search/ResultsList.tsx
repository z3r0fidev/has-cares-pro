"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
      <p className="text-muted-foreground italic py-8 text-center" role="status">
        {t("noResults")}
      </p>
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
