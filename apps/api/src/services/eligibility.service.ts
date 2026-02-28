/**
 * EligibilityService (NestJS injectable)
 *
 * Thin wrapper around the `@careequity/core` adapter factory so that NestJS
 * dependency injection can manage the singleton lifecycle. The adapter is
 * resolved once at application startup (onModuleInit) rather than on every
 * request to avoid token-exchange overhead.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  createEligibilityAdapter,
  type IEligibilityAdapter,
  type EligibilityRequest,
  type EligibilityResponse,
} from '@careequity/core';

@Injectable()
export class EligibilityService implements OnModuleInit {
  private readonly logger = new Logger(EligibilityService.name);
  private adapter!: IEligibilityAdapter;

  async onModuleInit(): Promise<void> {
    this.adapter = await createEligibilityAdapter();
    const isReal =
      Boolean(process.env['AVAILITY_CLIENT_ID']) &&
      Boolean(process.env['AVAILITY_CLIENT_SECRET']);
    this.logger.log(
      `EligibilityService initialized — adapter: ${isReal ? 'Availity (production)' : 'Mock (development)'}`,
    );
  }

  /**
   * Check whether a member is eligible for coverage under a given insurance
   * plan when seeing the specified provider.
   *
   * Throws on adapter-level errors (network timeouts, upstream 5xx, etc.).
   * The controller layer is responsible for translating these to HTTP 502.
   */
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    this.logger.debug(
      `Checking eligibility for memberId=${request.memberId} plan=${request.insurancePlanCode} npi=${request.providerNpi}`,
    );
    return this.adapter.checkEligibility(request);
  }
}
