import { Injectable } from '@nestjs/common';
import { esClient, INDEX_NAME } from '@careequity/core/src/search/client';

@Injectable()
export class SearchService {
  /**
   * Searches for providers with a "Best Match" AI-driven scoring model.
   * Priority: Distance -> Specialty Match -> Insurance Match -> Language Match
   */
  async searchProviders(lat: number, lon: number, radius: number, filters: any) {
    const query: any = {
      bool: {
        must: [
          {
            geo_distance: {
              distance: `${radius}mi`,
              location: { lat, lon },
            },
          },
        ],
        should: [], // Boosting filters
      },
    };

    // 1. Specialty Boost (High Priority)
    if (filters.specialty) {
      query.bool.must.push({
        match: { specialties: filters.specialty }
      });
    }

    // 2. Insurance Boost (Medium Priority)
    if (filters.insurance) {
      query.bool.should.push({
        match: {
          insurance: {
            query: filters.insurance,
            boost: 2.0
          }
        }
      });
    }

    // 3. Language Boost (Lower Priority)
    if (filters.preferredLanguage) {
      query.bool.should.push({
        match: {
          languages: {
            query: filters.preferredLanguage,
            boost: 1.5
          }
        }
      });
    }

    // 4. Verification Tier Boost (Trust Signal)
    query.bool.should.push({
      range: {
        verification_tier: {
          gte: 2,
          boost: 1.2
        }
      }
    });

    const response = await esClient.search({
      index: INDEX_NAME,
      body: {
        query,
        // Sort by Score (Best Match) primarily, then by distance
        sort: [
          { _score: "desc" },
          {
            _geo_distance: {
              location: { lat, lon },
              order: "asc",
              unit: "mi",
              mode: "min",
              distance_type: "arc",
              ignore_unmapped: true
            }
          }
        ]
      },
    });

    return response.hits.hits.map((hit: any) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));
  }
}
