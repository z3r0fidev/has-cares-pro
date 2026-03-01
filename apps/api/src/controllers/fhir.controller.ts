/**
 * FhirController
 *
 * GET /fhir/availability/:npi
 *   JWT-protected. Returns merged, deduplicated availability slots from all
 *   configured EHR adapters (Epic FHIR and/or Athenahealth) for the provider
 *   identified by NPI, covering today + the next 7 days.
 *
 *   When no adapters are configured an empty array is returned — callers
 *   should treat that as "fall back to manual availability".
 */

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { FhirService } from '../services/fhir.service';
import type { AvailabilitySlot } from '@careequity/core';

@ApiTags('fhir')
@ApiBearerAuth()
@Controller('fhir')
@UseGuards(JwtAuthGuard)
export class FhirController {
  constructor(private readonly fhirService: FhirService) {}

  /**
   * Get live appointment slots for a provider.
   *
   * @param npi  10-digit NPI string identifying the provider in the EHR
   * @returns    Chronologically sorted, deduplicated AvailabilitySlot[]
   */
  @Get('availability/:npi')
  @ApiOperation({ summary: 'Get live appointment slots from Epic/Athena for a provider NPI' })
  @ApiResponse({ status: 200, description: 'Availability slots and live flag' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailability(
    @Param('npi') npi: string,
  ): Promise<{ slots: AvailabilitySlot[]; live: boolean }> {
    const slots = await this.fhirService.getAvailability(npi);
    return {
      slots,
      live: this.fhirService.hasAdapters(),
    };
  }
}
