/**
 * AvailityEligibilityAdapter
 *
 * Production-grade stub for the Availity 270/271 Real-Time Eligibility REST API.
 * Reference: https://developer.availity.com/partner/documentation/eligibility
 *
 * Flow:
 *  1. Obtain a Bearer token via OAuth2 client-credentials grant.
 *  2. POST /eligibility/v1/checks with an ASC X12 270-equivalent JSON payload.
 *  3. Parse the 271-equivalent JSON response into EligibilityResponse.
 *
 * When AVAILITY_CLIENT_ID / AVAILITY_CLIENT_SECRET env vars are absent the
 * createEligibilityAdapter() factory will never instantiate this class; it is
 * only constructed in environments where credentials exist.
 */

import type { IEligibilityAdapter, EligibilityRequest, EligibilityResponse } from './EligibilityService';

/** Shape of Availity's OAuth token response */
interface AvailityTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/** Minimal shape we care about from Availity's eligibility response */
interface AvailityEligibilityResult {
  subscriberTraceNumber?: string;
  benefitInformation?: Array<{
    benefitCode?: string;
    benefitAmount?: number;
    benefitPercent?: number;
    coverageLevel?: string;
    planCoverage?: string;
  }>;
  coverageStatus?: string;
  planInformation?: {
    planName?: string;
    groupNumber?: string;
    coverageDateBegin?: string;
  };
}

/** Cached token with expiry tracking */
interface CachedToken {
  value: string;
  expiresAt: number; // Unix ms
}

const DEFAULT_API_URL = 'https://api.availity.com';
const TOKEN_ENDPOINT = '/availity/v1/token';
const ELIGIBILITY_ENDPOINT = '/eligibility/v1/checks';

/** Refresh the token 60 seconds before it actually expires */
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

export class AvailityEligibilityAdapter implements IEligibilityAdapter {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiUrl = process.env['AVAILITY_API_URL'] ?? DEFAULT_API_URL;
  }

  /** Obtain or reuse a cached OAuth2 Bearer token */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now) {
      return this.cachedToken.value;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const body = new URLSearchParams({ grant_type: 'client_credentials' });

    const res = await fetch(`${this.apiUrl}${TOKEN_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Availity token request failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as AvailityTokenResponse;
    const expiresAt = now + data.expires_in * 1000 - TOKEN_EXPIRY_BUFFER_MS;

    this.cachedToken = { value: data.access_token, expiresAt };
    return data.access_token;
  }

  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    const token = await this.getAccessToken();

    const payload = {
      submitterId: this.clientId,
      tradingPartnerServiceId: request.insurancePlanCode,
      subscriber: {
        memberId: request.memberId,
        dateOfBirth: request.memberDob,
      },
      provider: {
        npi: request.providerNpi,
      },
      serviceTypes: ['30'], // Health Benefit Plan Coverage
    };

    const res = await fetch(`${this.apiUrl}${ELIGIBILITY_ENDPOINT}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Availity eligibility check failed (${res.status}): ${text}`);
    }

    const data = (await res.json()) as AvailityEligibilityResult;
    return this.mapResponse(data);
  }

  /**
   * Maps Availity's proprietary response shape to our internal
   * EligibilityResponse. This method is deliberately defensive — any
   * unexpected shape falls back to ineligible rather than throwing.
   */
  private mapResponse(data: AvailityEligibilityResult): EligibilityResponse {
    const eligible = data.coverageStatus === 'Active';
    const planName = data.planInformation?.planName ?? 'Unknown Plan';
    const coverageStart = data.planInformation?.coverageDateBegin;

    // Find copay benefit (benefitCode "B" = co-payment per Availity docs)
    const copayEntry = data.benefitInformation?.find(
      (b) => b.benefitCode === 'B' && b.benefitAmount !== undefined,
    );
    const copay = copayEntry?.benefitAmount;

    // Find deductible benefit (benefitCode "DED")
    const deductibleEntry = data.benefitInformation?.find(
      (b) => b.benefitCode === 'DED' && b.benefitAmount !== undefined,
    );
    const deductible = deductibleEntry?.benefitAmount;

    return {
      eligible,
      planName,
      ...(coverageStart ? { coverageStart } : {}),
      ...(copay !== undefined ? { copay } : {}),
      ...(deductible !== undefined ? { deductible } : {}),
      source: 'availity',
    };
  }
}
