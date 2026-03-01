/**
 * EligibilityController
 *
 * POST /eligibility/check
 *   JWT-protected. Rate-limited to 10 requests per minute per client to
 *   prevent abuse of the upstream Availity API.
 *
 * Translates adapter errors to HTTP 502 Bad Gateway so the frontend receives
 * a structured error rather than an opaque 500.
 */

import {
  Controller,
  Post,
  Body,
  UseGuards,
  BadGatewayException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { EligibilityService } from '../services/eligibility.service';
import { CheckEligibilityDto } from '../dto/eligibility.dto';
import type { EligibilityResponse } from '@careequity/core';

@ApiTags('eligibility')
@ApiBearerAuth()
@Controller('eligibility')
@UseGuards(JwtAuthGuard)
export class EligibilityController {
  private readonly logger = new Logger(EligibilityController.name);

  constructor(private readonly eligibilityService: EligibilityService) {}

  /**
   * Check real-time insurance eligibility for a patient/provider combination.
   *
   * Rate limit: 10 requests per 60-second window per IP.
   * The tight limit mirrors production usage expectations and protects the
   * Availity API quota (which is billed per-call on most plans).
   */
  @Post('check')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Check real-time insurance eligibility via Availity' })
  @ApiResponse({ status: 200, description: 'Eligibility result from Availity' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 502, description: 'Upstream eligibility service unavailable' })
  async check(@Body() dto: CheckEligibilityDto): Promise<EligibilityResponse> {
    try {
      return await this.eligibilityService.checkEligibility({
        memberId: dto.memberId,
        memberDob: dto.memberDob,
        insurancePlanCode: dto.insurancePlanCode,
        providerNpi: dto.providerNpi,
      });
    } catch (err) {
      this.logger.error('Eligibility check upstream failure', (err as Error).message);
      throw new BadGatewayException(
        'Unable to reach the insurance eligibility service. Please try again.',
      );
    }
  }
}
