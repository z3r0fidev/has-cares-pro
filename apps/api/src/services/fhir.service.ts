/**
 * FhirService (NestJS injectable)
 *
 * Coordinates Epic FHIR and Athenahealth adapters. At startup it inspects
 * environment variables and instantiates only the adapters that have
 * credentials configured. An empty adapter list is valid — the service simply
 * returns an empty slot array.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  EpicFhirAdapter,
  AthenahealthAdapter,
  mergeSlots,
  nextSevenDays,
  type IFhirAdapter,
  type AvailabilitySlot,
} from '@careequity/core';

@Injectable()
export class FhirService implements OnModuleInit {
  private readonly logger = new Logger(FhirService.name);
  private adapters: IFhirAdapter[] = [];

  onModuleInit(): void {
    const epicClientId = process.env['EPIC_CLIENT_ID'];
    const epicClientSecret = process.env['EPIC_CLIENT_SECRET'];
    const athenaClientId = process.env['ATHENA_CLIENT_ID'];
    const athenaClientSecret = process.env['ATHENA_CLIENT_SECRET'];

    if (epicClientId && epicClientSecret) {
      this.adapters.push(new EpicFhirAdapter(epicClientId, epicClientSecret));
      this.logger.log('Epic FHIR adapter enabled');
    } else {
      this.logger.warn('Epic FHIR adapter DISABLED — EPIC_CLIENT_ID / EPIC_CLIENT_SECRET not set');
    }

    if (athenaClientId && athenaClientSecret) {
      this.adapters.push(new AthenahealthAdapter(athenaClientId, athenaClientSecret));
      this.logger.log('Athenahealth adapter enabled');
    } else {
      this.logger.warn(
        'Athenahealth adapter DISABLED — ATHENA_CLIENT_ID / ATHENA_CLIENT_SECRET not set',
      );
    }

    if (this.adapters.length === 0) {
      this.logger.warn(
        'No FHIR adapters are configured — /fhir/availability will return empty arrays',
      );
    }
  }

  /**
   * Fetch and merge available slots for a provider NPI across all configured
   * adapters for today through the next 7 days.
   *
   * Never throws — individual adapter failures are logged and treated as
   * empty result sets so partial availability data is still surfaced.
   */
  async getAvailability(providerNpi: string): Promise<AvailabilitySlot[]> {
    if (this.adapters.length === 0) {
      return [];
    }

    const dates = nextSevenDays();

    // Fan out: fetch all adapters × all dates concurrently
    const allSlotArrays = await Promise.all(
      this.adapters.flatMap((adapter) =>
        dates.map((date) => adapter.getSlots(providerNpi, date)),
      ),
    );

    return mergeSlots(allSlotArrays);
  }

  /** Returns true when at least one adapter is configured */
  hasAdapters(): boolean {
    return this.adapters.length > 0;
  }
}
