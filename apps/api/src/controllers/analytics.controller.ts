import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EventType } from '@careequity/db';
import { AuthenticatedRequest } from '../types/request.interface';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('record')
  async record(@Body() body: { providerId: string, type: EventType }, @Request() req: AuthenticatedRequest) {
    // We allow unauthenticated recording (public search users)
    const userAgent = req.headers['user-agent'];
    return this.analyticsService.recordEvent(body.providerId, body.type, userAgent);
  }

  @Get('stats/:providerId')
  @UseGuards(JwtAuthGuard)
  async getStats(@Param('providerId') providerId: string, @Request() req: AuthenticatedRequest) {
    // Only allow provider to see their own stats or admin
    if (req.user.providerId !== providerId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only view your own analytics');
    }
    return this.analyticsService.getStats(providerId);
  }

  @Get('admin/performance')
  @UseGuards(JwtAuthGuard)
  async getPerformance(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getGlobalPerformanceStats();
  }

  @Get('admin/claims')
  @UseGuards(JwtAuthGuard)
  async getClaims(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getClaimRateStats();
  }
}
