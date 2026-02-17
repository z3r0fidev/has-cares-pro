import { Injectable } from '@nestjs/common';
import { esClient, INDEX_NAME } from '@careequity/core/src/search/client';

@Injectable()
export class SearchService {
  async searchProviders(lat: number, lon: number, radius: number, filters: any) {
    const response = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must: [
            {
              geo_distance: {
                distance: `${radius}mi`,
                location: {
                  lat,
                  lon,
                },
              },
            },
            // Add other filters here
          ],
        },
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    }));
  }
}
