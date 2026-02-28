/**
 * AthenahealthAdapter
 *
 * Fetches open appointment slots from the Athenahealth V2 REST API.
 *
 * Required env vars (adapter no-ops gracefully when absent):
 *   ATHENA_CLIENT_ID
 *   ATHENA_CLIENT_SECRET
 *   ATHENA_API_URL  (default: https://api.athenahealth.com/v1)
 *
 * Athenahealth does not implement FHIR natively; it uses its own proprietary
 * REST API. This adapter maps the Athena response into our AvailabilitySlot
 * shape so the rest of the system treats it identically to Epic slots.
 *
 * API flow:
 *   POST /oauth2/v1/token   — client credentials grant
 *   GET  /appointments/open — open slots for a provider (filtered by NPI)
 */

import type { IFhirAdapter, AvailabilitySlot } from './FhirAvailabilityService';

const DEFAULT_API_URL = 'https://api.athenahealth.com/v1';
const TOKEN_ENDPOINT = 'https://api.athenahealth.com/oauth2/v1/token';
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

/** Minimal shape from Athena's open-appointments response */
interface AthenaAppointment {
  appointmentid?: string;
  /** Local date string e.g. "03/15/2026" (MM/DD/YYYY) */
  date?: string;
  /** 24-hour time string e.g. "09:00" */
  starttime?: string;
  /** Duration in minutes */
  duration?: number;
  appointmenttypeid?: string;
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export class AthenahealthAdapter implements IFhirAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiUrl = (process.env['ATHENA_API_URL'] ?? DEFAULT_API_URL).replace(/\/$/, '');
  }

  static isConfigured(): boolean {
    return Boolean(
      process.env['ATHENA_CLIENT_ID'] && process.env['ATHENA_CLIENT_SECRET'],
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
      body: new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Athenahealth token request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    const expiresAt = now + data.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS;

    this.cachedToken = { value: data.access_token, expiresAt };
    return data.access_token;
  }

  /**
   * Convert an Athena MM/DD/YYYY + HH:MM pair into an ISO 8601 string.
   * Athena returns local time — we attach 'Z' as a convention since
   * true timezone data is not present in the basic API response.
   */
  private toIso(date: string, time: string): string {
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}:00Z`;
  }

  async getSlots(providerNpi: string, date: string): Promise<AvailabilitySlot[]> {
    try {
      const token = await this.getAccessToken();

      // Athena uses MM/DD/YYYY format for its date filter
      const [year, month, day] = date.split('-');
      const athenaDate = `${month}/${day}/${year}`;

      const params = new URLSearchParams({
        date: athenaDate,
        providernpi: providerNpi,
        appointmenttypeid: 'any',
      });

      const res = await fetch(
        `${this.apiUrl}/appointments/open?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Athenahealth appointments/open failed (${res.status}): ${text}`,
        );
      }

      const data = (await res.json()) as { appointments?: AthenaAppointment[] };
      const appointments = data.appointments ?? [];

      return appointments
        .filter((a): a is AthenaAppointment & { date: string; starttime: string } =>
          Boolean(a.date && a.starttime),
        )
        .map((a): AvailabilitySlot => {
          const start = this.toIso(a.date, a.starttime);
          const durationMs = (a.duration ?? 30) * 60_000;
          const end = new Date(new Date(start).getTime() + durationMs).toISOString();
          return { start, end, status: 'free', source: 'athenahealth' };
        });
    } catch (err) {
      console.warn('[AthenahealthAdapter] getSlots failed:', (err as Error).message);
      return [];
    }
  }
}
