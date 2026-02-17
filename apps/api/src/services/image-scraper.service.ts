import { Injectable } from '@nestjs/common';
import { ScraperUtils } from '@careequity/core';
import { AppDataSource, Provider } from '@careequity/db';
import { esClient, INDEX_NAME } from '@careequity/core';

@Injectable()
export class ImageScraperService {
  /**
   * Scrapes a provider's website for a profile image and updates their profile if found.
   */
  async scrapeAndStore(providerId: string, url: string): Promise<string | null> {
    const imageUrl = await ScraperUtils.findProfileImage(url);
    if (!imageUrl) return null;

    const repo = AppDataSource.getRepository(Provider);
    const provider = await repo.findOneBy({ id: providerId });
    
    if (provider) {
      provider.profile_image_url = imageUrl;
      await repo.save(provider);

      // Sync to ES
      await esClient.update({
        index: INDEX_NAME,
        id: provider.id,
        doc: {
          profile_image_url: imageUrl
        }
      });
    }

    return imageUrl;
  }
}
