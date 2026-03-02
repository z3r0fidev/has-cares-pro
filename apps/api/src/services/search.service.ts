import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { esClient, INDEX_NAME, providerMapping } from '@careequity/core';
import NodeCache from 'node-cache';
import { AnalyticsService } from './analytics.service';

export interface SearchFilters {
  specialty?: string;
  insurance?: string;
  preferredLanguage?: string;
}

@Injectable()
export class SearchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchService.name);
  constructor(private readonly analyticsService: AnalyticsService) {}
  private cache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes

  async onApplicationBootstrap() {
    try {
      const exists = await esClient.indices.exists({ index: INDEX_NAME });
      if (!exists) {
        await esClient.indices.create({ index: INDEX_NAME, mappings: providerMapping });
        this.logger.log(`Created Elasticsearch index: ${INDEX_NAME}`);
      }
    } catch (err) {
      this.logger.warn(`Could not verify/create ES index "${INDEX_NAME}": ${(err as Error).message}`);
    }
  }

  /**
   * Searches for providers with a "Best Match" AI-driven scoring model.
   * Priority: Distance -> Specialty Match -> Insurance Match -> Language Match
   */
  async searchProviders(lat: number, lon: number, radius: number, filters: SearchFilters) {
    const startTime = Date.now();
    const cacheKey = JSON.stringify({ lat, lon, radius, filters });
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      const responseTime = Date.now() - startTime;
      this.analyticsService.recordSearchEvent(responseTime, { ...filters, cached: true, result_count: (cachedResult as unknown[]).length }).catch(() => {});
      return cachedResult;
    }

    const query: Record<string, unknown> = {
      bool: {
        must: [
          {
            geo_distance: {
              distance: `${radius}mi`,
              location: { lat, lon },
            },
          },
        ],
        should: [] as unknown[], // Boosting filters
      } as Record<string, unknown>,
    };

    const boolQuery = query.bool as Record<string, unknown[]>;

    // 1. Specialty Boost (High Priority)
    if (filters.specialty) {
      boolQuery.must.push({
        match: { specialties: filters.specialty }
      });
    }

    // 2. Insurance Boost (Medium Priority) — term query for keyword array field
    if (filters.insurance) {
      boolQuery.should.push({
        term: {
          insurance: {
            value: filters.insurance,
            boost: 2.0,
          },
        },
      });
    }

    // 3. Language Boost (Lower Priority)
    if (filters.preferredLanguage) {
      boolQuery.should.push({
        match: {
          languages: {
            query: filters.preferredLanguage,
            boost: 1.5
          }
        }
      });
    }

    // 4. Verification Tier Boost (Trust Signal)
    boolQuery.should.push({
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
        sort: [
          "_score",
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

    const result = (response.hits.hits as { _id: string; _score: number; _source: Record<string, unknown> }[]).map((hit) => ({
      id: hit._id,
      score: hit._score,
      ...hit._source,
    }));

    const responseTime = Date.now() - startTime;
    this.analyticsService.recordSearchEvent(responseTime, { ...filters, cached: false, result_count: result.length }).catch(() => {});

    this.cache.set(cacheKey, result);
    return result;
  }
}
