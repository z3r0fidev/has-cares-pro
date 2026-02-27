"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, ChevronDown } from "lucide-react";
import { SPECIALTIES, INSURANCE_PROVIDERS } from "@careequity/core/src/types/index";
import { useTranslations } from "next-intl";

interface HorizontalSearchBarProps {
  onSearch: (filters: { zip: string; specialty: string; insurance: string }) => void;
  defaultInsurance?: string;
}

export default function HorizontalSearchBar({
  onSearch,
  defaultInsurance = "",
}: HorizontalSearchBarProps) {
  const t = useTranslations("Search");
  const [zip, setZip] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [insurance, setInsurance] = useState(defaultInsurance);

  // Sync when parent pre-selects insurance via hero pills
  useEffect(() => {
    setInsurance(defaultInsurance);
  }, [defaultInsurance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ zip, specialty, insurance });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-white border border-slate-200 rounded-2xl shadow-md p-2 flex flex-col md:flex-row gap-2"
      aria-label="Physician search form"
    >
      {/* Location / ZIP */}
      <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl md:border-0 md:border-r md:rounded-none md:rounded-l-xl md:border-r-slate-200 focus-within:ring-2 focus-within:ring-primary/30">
        <MapPin
          className="text-slate-400 flex-shrink-0"
          size={18}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <label htmlFor="search-zip" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {t("zip")}
          </label>
          <input
            id="search-zip"
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder={t("locationPlaceholder")}
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
          />
        </div>
      </div>

      <div className="hidden md:block w-px bg-slate-200 self-stretch" aria-hidden="true" />

      {/* Specialty */}
      <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl md:border-0 md:rounded-none focus-within:ring-2 focus-within:ring-primary/30 relative">
        <div className="flex-1 min-w-0">
          <label htmlFor="search-specialty" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {t("specialty")}
          </label>
          <select
            id="search-specialty"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full text-sm text-slate-900 bg-transparent outline-none appearance-none pr-6 cursor-pointer"
            aria-label="Filter by medical specialty"
          >
            <option value="">{t("allSpecialties")}</option>
            {SPECIALTIES.sort().map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="text-slate-400 flex-shrink-0 absolute right-3" size={16} aria-hidden="true" />
      </div>

      <div className="hidden md:block w-px bg-slate-200 self-stretch" aria-hidden="true" />

      {/* Insurance */}
      <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-xl md:border-0 md:rounded-none focus-within:ring-2 focus-within:ring-primary/30 relative">
        <div className="flex-1 min-w-0">
          <label htmlFor="search-insurance" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {t("insurance")}
          </label>
          <select
            id="search-insurance"
            value={insurance}
            onChange={(e) => setInsurance(e.target.value)}
            className="w-full text-sm text-slate-900 bg-transparent outline-none appearance-none pr-6 cursor-pointer"
            aria-label="Filter by accepted insurance"
          >
            <option value="">{t("allInsurance")}</option>
            {INSURANCE_PROVIDERS.sort().map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="text-slate-400 flex-shrink-0 absolute right-3" size={16} aria-hidden="true" />
      </div>

      {/* Search button */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-[oklch(0.78_0.17_84.429)] transition-colors shadow-sm whitespace-nowrap"
        aria-label="Search for physicians"
      >
        <Search size={18} aria-hidden="true" />
        <span className="hidden md:inline">{t("searchButton")}</span>
        <span className="md:hidden">{t("searchButton")}</span>
      </button>
    </form>
  );
}
