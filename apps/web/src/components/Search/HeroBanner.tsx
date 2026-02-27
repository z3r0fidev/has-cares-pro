"use client";

import { useTranslations } from "next-intl";
import InsuranceLogo from "@/components/Insurance/InsuranceLogo";

interface InsurancePill {
  label: string;
  value: string;
}

interface HeroBannerProps {
  onInsuranceSelect: (insurance: string) => void;
  selectedInsurance?: string;
}

const INSURANCE_PILLS: InsurancePill[] = [
  { label: "Aetna", value: "Aetna" },
  { label: "Cigna", value: "Cigna" },
  { label: "UnitedHealthcare", value: "UnitedHealthcare" },
  { label: "Medicare", value: "Medicare" },
  { label: "BlueCross BlueShield", value: "BlueCross BlueShield" },
];

export default function HeroBanner({ onInsuranceSelect, selectedInsurance = '' }: HeroBannerProps) {
  const t = useTranslations("Home");

  return (
    <section
      className="w-full bg-slate-100 py-10 px-4"
      aria-label="Search hero section"
    >
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">
          {t("heroTitle")}
        </h1>
        <p className="text-lg text-slate-500 mb-6">{t("heroSubtitle")}</p>

        {/* Insurance filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {INSURANCE_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => onInsuranceSelect(pill.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border ${
                selectedInsurance === pill.value
                  ? 'bg-primary/10 border-primary text-slate-900 font-semibold ring-2 ring-primary/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-primary hover:shadow-sm'
              }`}
              aria-pressed={selectedInsurance === pill.value}
              aria-label={`Filter by ${pill.label} insurance`}
            >
              <InsuranceLogo name={pill.value} size={16} />
              {pill.label}
            </button>
          ))}
          <button
            className="flex-shrink-0 px-4 py-2 text-sm font-medium text-primary hover:underline whitespace-nowrap"
            onClick={() => {}}
            aria-label="Add your insurance plan"
          >
            + {t("addInsurance")}
          </button>
        </div>
      </div>
    </section>
  );
}
