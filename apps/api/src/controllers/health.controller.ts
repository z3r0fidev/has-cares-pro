import { Controller, Get } from '@nestjs/common';
import { AppDataSource } from '@careequity/db';
import { esClient } from '@careequity/core';

@Controller('health')
export class HealthController {
  @Get()
  async check() {
    const [db, es] = await Promise.all([
      AppDataSource.query('SELECT 1').then(() => true).catch(() => false),
      esClient.ping().then(() => true).catch(() => false),
    ]);

    const status = db && es ? 'ok' : 'degraded';
    return { status, db, es };
  }
}
