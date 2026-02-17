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
    }, {});
  }
}
