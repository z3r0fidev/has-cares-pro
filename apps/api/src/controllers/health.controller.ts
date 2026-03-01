import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppDataSource } from '@careequity/db';
import { esClient } from '@careequity/core';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness and readiness check for DB and Elasticsearch' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async check() {
    const [db, es] = await Promise.all([
      AppDataSource.query('SELECT 1').then(() => true).catch(() => false),
      esClient.ping().then(() => true).catch(() => false),
    ]);

    const status = db && es ? 'ok' : 'degraded';
    return { status, db, es };
  }
}
