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

  async getTopSearchFilters() {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    const events = await repo.find({
      where: { type: EventType.SEARCH_QUERY },
      select: ['metadata'],
      order: { created_at: 'DESC' },
      take: 1000,
    });
    const specialtyCounts: Record<string, number> = {};
    const insuranceCounts: Record<string, number> = {};
    for (const event of events) {
      if (!event.metadata) continue;
      try {
        const parsed = JSON.parse(event.metadata) as Record<string, unknown>;
        if (typeof parsed.specialty === 'string' && parsed.specialty)
          specialtyCounts[parsed.specialty] = (specialtyCounts[parsed.specialty] ?? 0) + 1;
        if (typeof parsed.insurance === 'string' && parsed.insurance)
          insuranceCounts[parsed.insurance] = (insuranceCounts[parsed.insurance] ?? 0) + 1;
      } catch { /* skip malformed */ }
    }
    const toSorted = (counts: Record<string, number>) =>
      Object.entries(counts).map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count).slice(0, 10);
    return { top_specialties: toSorted(specialtyCounts), top_insurances: toSorted(insuranceCounts) };
  }

  async getZeroResultQueries() {
    const repo = AppDataSource.getRepository(AnalyticsEvent);
    const events = await repo.find({
      where: { type: EventType.SEARCH_QUERY },
      select: ['metadata'],
      order: { created_at: 'DESC' },
      take: 5000,
    });
    let total = 0; let zeroCount = 0;
    for (const event of events) {
      if (!event.metadata) continue;
      total++;
      try {
        const parsed = JSON.parse(event.metadata) as Record<string, unknown>;
        if (parsed.result_count === 0) zeroCount++;
      } catch { /* skip */ }
    }
    return {
      zero_result_count: zeroCount,
      total_search_count: total,
      zero_result_percentage: total > 0 ? (zeroCount / total) * 100 : 0,
    };
  }
}
