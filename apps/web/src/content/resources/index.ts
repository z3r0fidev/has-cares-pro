import type { ResourceArticle } from "./types";
import hypertension from "./understanding-hypertension-black-communities";
import diabetes from "./navigating-type-2-diabetes-latino-patients";
import mentalHealth from "./mental-health-arab-american-communities";

/**
 * All published resource articles, ordered by publishedAt descending.
 * Add new articles here to make them visible across the site.
 */
export const ALL_ARTICLES: ResourceArticle[] = [
  hypertension,
  diabetes,
  mentalHealth,
].sort(
  (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
);

export function getArticleBySlug(slug: string): ResourceArticle | undefined {
  return ALL_ARTICLES.find((a) => a.slug === slug);
}

export type { ResourceArticle };
