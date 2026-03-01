import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EventType } from '@careequity/db';
import { AuthenticatedRequest } from '../types/request.interface';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('record')
  @ApiOperation({ summary: 'Record a provider view or contact analytics event' })
  @ApiResponse({ status: 201, description: 'Event recorded' })
  async record(@Body() body: { providerId: string, type: EventType }, @Request() req: AuthenticatedRequest) {
    // We allow unauthenticated recording (public search users)
    const userAgent = req.headers['user-agent'];
    return this.analyticsService.recordEvent(body.providerId, body.type, userAgent);
  }

  @Get('stats/:providerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics stats for a specific provider' })
  @ApiResponse({ status: 200, description: 'Analytics stats' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getStats(@Param('providerId') providerId: string, @Request() req: AuthenticatedRequest) {
    // Only allow provider to see their own stats or admin
    if (req.user.providerId !== providerId && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only view your own analytics');
    }
    return this.analyticsService.getStats(providerId);
  }

  @Get('admin/performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Global performance stats across all providers (admin)' })
  @ApiResponse({ status: 200, description: 'Global performance stats' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getPerformance(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getGlobalPerformanceStats();
  }

  @Get('admin/claims')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profile claim rate stats (admin)' })
  @ApiResponse({ status: 200, description: 'Claim rate stats' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getClaims(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getClaimRateStats();
  }

  @Get('admin/search-filters')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Most-used search filter combinations (admin)' })
  @ApiResponse({ status: 200, description: 'Top search filters' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getSearchFilters(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getTopSearchFilters();
  }

  @Get('admin/zero-results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Searches that returned zero results (admin)' })
  @ApiResponse({ status: 200, description: 'Zero-result query list' })
  @ApiResponse({ status: 403, description: 'Admin access required' })
  async getZeroResults(@Request() req: AuthenticatedRequest) {
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.analyticsService.getZeroResultQueries();
  }
}
