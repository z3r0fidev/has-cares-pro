import axios from 'axios';
import * as cheerio from 'cheerio';

export class ScraperUtils {
  /**
   * Attempts to find a profile image URL from a given website URL.
   * Looks for Open Graph tags, twitter cards, and common profile image patterns.
   */
  static async findProfileImage(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url, { 
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 1. Try Open Graph image
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) return this.resolveUrl(url, ogImage);
      
      // 2. Try Twitter image
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      if (twitterImage) return this.resolveUrl(url, twitterImage);
      
      // 3. Look for common profile image classes or IDs (heuristic)
      const heuristicImage = $('img[class*="profile"], img[id*="profile"], img[src*="profile"]').first().attr('src');
      if (heuristicImage) return this.resolveUrl(url, heuristicImage);

      return null;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Scraping failed for ${url}:`, error.message);
      } else {
        console.error(`Scraping failed for ${url}:`, String(error));
      }
      return null;
    }
  }

  private static resolveUrl(base: string, relative: string): string {
    if (relative.startsWith('http')) return relative;
    const url = new URL(base);
    return `${url.protocol}//${url.host}${relative.startsWith('/') ? '' : '/'}${relative}`;
  }
}
