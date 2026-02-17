import { Injectable } from '@nestjs/common';
import { AppDataSource, AnalyticsEvent, EventType, Provider } from '@careequity/db';

@Injectable()
export class AnalyticsService {
  async recordEvent(providerId: string, type: EventType, userAgent?: string) {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    const event = repo.create({
      provider: { id: providerId } as Provider,
      type,
      user_agent: userAgent
    });
    return repo.save(event);
  }

  async recordSearchEvent(responseTimeMs: number, filters: Record<string, unknown>, userAgent?: string) {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    const event = repo.create({
      type: EventType.SEARCH_QUERY,
      response_time_ms: responseTimeMs,
      metadata: JSON.stringify(filters),
      user_agent: userAgent
    });
    return repo.save(event);
  }

  async getStats(providerId: string) {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    
    const stats = await repo
      .createQueryBuilder('event')
      .select('event.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('event.providerId = :providerId', { providerId })
      .groupBy('event.type')
      .getRawMany();

    // Format results into a friendly object
    return stats.reduce((acc, curr) => {
      acc[curr.type] = parseInt(curr.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async getGlobalPerformanceStats() {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    
    return repo
      .createQueryBuilder('event')
      .select('AVG(event.response_time_ms)', 'avg_response_time')
      .addSelect('MAX(event.response_time_ms)', 'max_response_time')
      .addSelect('COUNT(*)', 'search_count')
      .where('event.type = :type', { type: EventType.SEARCH_QUERY })
      .getRawOne();
  }

  async getClaimRateStats() {
    const providerRepo = AppDataSource.getRepository(Provider);
    const total = await providerRepo.count();
    const claimed = await providerRepo.count({ where: { is_claimed: true } });
    
    return {
      total_providers: total,
      claimed_providers: claimed,
      claim_rate: total > 0 ? (claimed / total) * 100 : 0
    };
  }
}
