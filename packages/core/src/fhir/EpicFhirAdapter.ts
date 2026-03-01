/**
 * EpicFhirAdapter
 *
 * Fetches appointment availability from Epic's FHIR R4 endpoint using the
 * SMART on FHIR OAuth2 client-credentials flow.
 *
 * Required env vars (adapter no-ops gracefully when absent):
 *   EPIC_CLIENT_ID
 *   EPIC_CLIENT_SECRET
 *   EPIC_FHIR_BASE_URL  (default: https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4)
 *
 * FHIR resource flow:
 *   GET /Schedule?actor=Practitioner/<npi>&status=active
 *   GET /Slot?schedule=<scheduleId>&status=free&date=<YYYY-MM-DD>
 */

import { FhirClient, FhirBundle } from './FhirClient';
import type { IFhirAdapter, AvailabilitySlot } from './FhirAvailabilityService';

const DEFAULT_BASE_URL =
  'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';
const TOKEN_ENDPOINT =
  'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

/** Minimal FHIR Schedule resource fields */
interface FhirSchedule {
  resourceType: 'Schedule';
  id?: string;
  active?: boolean;
}

/** Minimal FHIR Slot resource fields */
interface FhirSlot {
  resourceType: 'Slot';
  id?: string;
  start?: string;
  end?: string;
  status?: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export class EpicFhirAdapter implements IFhirAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly fhirClient: FhirClient;
  private cachedToken: CachedToken | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.fhirClient = new FhirClient({
      baseUrl: process.env['EPIC_FHIR_BASE_URL'] ?? DEFAULT_BASE_URL,
    });
  }

  /** Determine whether this adapter is configured in the current environment */
  static isConfigured(): boolean {
    return Boolean(
      process.env['EPIC_CLIENT_ID'] && process.env['EPIC_CLIENT_SECRET'],
    );
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      return this.cachedToken.value;
    }

    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'system/Schedule.read system/Slot.read',
      }).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Epic SMART token request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    const expiresAt = now + data.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS;

    this.cachedToken = { value: data.access_token, expiresAt };
    return data.access_token;
  }

  async getSlots(providerNpi: string, date: string): Promise<AvailabilitySlot[]> {
    try {
      const token = await this.getAccessToken();
      this.fhirClient.setAccessToken(token);

      // Step 1: Find Schedule resources linked to this NPI
      const scheduleBundle = await this.fhirClient.get<FhirBundle<FhirSchedule>>(
        `/Schedule?actor=Practitioner/${providerNpi}&status=active`,
      );

      const scheduleIds = (scheduleBundle.entry ?? [])
        .map((e) => e.resource?.id)
        .filter((id): id is string => Boolean(id));

      if (scheduleIds.length === 0) {
        return [];
      }

      // Step 2: Fetch free Slots for each Schedule on this date
      const slotResults = await Promise.all(
        scheduleIds.map(async (scheduleId): Promise<AvailabilitySlot[]> => {
          const slotBundle = await this.fhirClient.get<FhirBundle<FhirSlot>>(
            `/Slot?schedule=Schedule/${scheduleId}&status=free&date=${date}`,
          );

          return (slotBundle.entry ?? [])
            .map((e) => e.resource)
            .filter((s): s is FhirSlot => Boolean(s?.start && s?.end))
            .map((slot): AvailabilitySlot => ({
              start: slot.start as string,
              end: slot.end as string,
              status: 'free',
              source: 'epic',
            }));
        }),
      );

      return slotResults.flat();
    } catch (err) {
      // Log but do not propagate — callers expect graceful degradation
      console.warn('[EpicFhirAdapter] getSlots failed:', (err as Error).message);
      return [];
    }
  }
}
