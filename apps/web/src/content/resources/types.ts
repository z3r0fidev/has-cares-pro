/**
 * Static article content model for community health resources.
 *
 * Articles live as TypeScript files in this directory — no CMS is required
 * at this stage. When a headless CMS is adopted, this interface becomes the
 * contract between the CMS schema and the frontend rendering layer.
 */
export interface ResourceArticle {
  /** URL-safe identifier, must be unique across all articles. */
  slug: string;

  /** English title (canonical). */
  title: string;
  /** Spanish title. */
  titleEs: string;
  /** Arabic title. */
  titleAr: string;

  /** English summary shown on listing cards (1–2 sentences). */
  summary: string;
  /** Spanish summary. */
  summaryEs: string;
  /** Arabic summary. */
  summaryAr: string;

  /** The primary CareEquity specialty this article relates to. */
  specialty: string;

  /** Search / filter tags (lowercase, hyphenated). */
  tags: string[];

  /** ISO 8601 publication date string (YYYY-MM-DD). */
  publishedAt: string;

  /** Full article body in English (plain paragraphs separated by `\n\n`). */
  body: string;
  /** Full article body in Spanish. */
  bodyEs: string;
  /** Full article body in Arabic. */
  bodyAr: string;
}
