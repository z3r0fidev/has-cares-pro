import type { MetadataRoute } from "next";
import { SPECIALTIES } from "@careequity/core/src/types/index";
import {
  COVERED_STATES,
  specialtyToSlug,
} from "./[locale]/directory/[state]/[specialty]/page";
import { ALL_ARTICLES } from "../content/resources";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://careequity.health";
const LOCALES = ["en", "es", "ar"] as const;

/**
 * Top-level pages that exist in every locale.
 * Paths are locale-relative (no leading slash needed — we prepend the locale).
 */
const TOP_LEVEL_PATHS = [
  "",           // home
  "/resources", // community resources hub
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  // ── 1. Top-level locale pages ────────────────────────────────────────────
  for (const locale of LOCALES) {
    for (const path of TOP_LEVEL_PATHS) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1.0 : 0.7,
      });
    }
  }

  // ── 2. Directory pages (/[locale]/directory/[state]/[specialty]) ──────────
  for (const locale of LOCALES) {
    for (const state of COVERED_STATES) {
      for (const specialty of SPECIALTIES) {
        entries.push({
          url: `${BASE_URL}/${locale}/directory/${state.slug}/${specialtyToSlug(specialty)}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  }

  // ── 3. Resource article pages (/[locale]/resources/[slug]) ───────────────
  for (const locale of LOCALES) {
    for (const article of ALL_ARTICLES) {
      entries.push({
        url: `${BASE_URL}/${locale}/resources/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return entries;
}
