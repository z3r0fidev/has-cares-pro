"use client";

import { ShieldCheck } from "lucide-react";

interface VerificationBadgeProps {
  tier: number;
  size?: "sm" | "md";
}

const TIER_CONFIG: Record<
  number,
  { label: string; tooltip: string; classes: string }
> = {
  1: {
    label: "NPI Verified",
    tooltip: "NPI license number confirmed with the National Provider Identifier registry.",
    classes: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  2: {
    label: "Identity Verified",
    tooltip: "Provider identity and credentials have been independently confirmed.",
    classes: "bg-indigo-100 text-indigo-800 border border-indigo-200",
  },
  3: {
    label: "Practice Verified",
    tooltip: "Practice location, hours, and insurance accepted are confirmed on-site.",
    classes: "bg-green-100 text-green-800 border border-green-200",
  },
};

export default function VerificationBadge({ tier, size = "md" }: VerificationBadgeProps) {
  const config = TIER_CONFIG[tier];
  if (!config) return null;

  const iconSize = size === "sm" ? 10 : 12;
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${textSize} ${config.classes} cursor-default`}
      title={config.tooltip}
      aria-label={`${config.label}: ${config.tooltip}`}
    >
      <ShieldCheck
        width={iconSize}
        height={iconSize}
        aria-hidden="true"
        strokeWidth={2.5}
      />
      {config.label}
    </span>
  );
}
