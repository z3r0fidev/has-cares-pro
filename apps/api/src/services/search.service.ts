import { Injectable } from '@nestjs/common';
import { esClient, INDEX_NAME } from '@careequity/core';

@Injectable()
export class SearchService {
  async searchProviders(lat: number, lon: number, radius: number, filters: any) {
    const must: any[] = [
      {
        geo_distance: {
          distance: `${radius}mi`,
          location: {
            lat,
            lon,
          },
        },
      },
    ];

    if (filters.specialty) {
      must.push({
        match: {
          specialties: filters.specialty,
        },
      });
    }

    const response = await esClient.search({
      index: INDEX_NAME,
      query: {
        bool: {
          must,
        },
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      ...hit._source,
    }));
  }
}
