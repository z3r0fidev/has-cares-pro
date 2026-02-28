/**
 * Insurance Eligibility Service — abstract interface and factory.
 *
 * The factory inspects environment variables at construction time:
 *  - When AVAILITY_CLIENT_ID + AVAILITY_CLIENT_SECRET are both present the
 *    AvailityEligibilityAdapter is used (real HTTP calls to the Availity 5010
 *    REST API).
 *  - Otherwise the MockEligibilityAdapter is used, which is deterministic and
 *    safe for development / CI.
 */

export interface EligibilityRequest {
  /** Payer-issued member ID */
  memberId: string;
  /** Patient date of birth in YYYY-MM-DD format */
  memberDob: string;
  /** Short plan code, e.g. "BCBS-PPO" or "Aetna-HMO" */
  insurancePlanCode: string;
  /** Rendering provider NPI (10-digit string) */
  providerNpi: string;
}

export interface EligibilityResponse {
  eligible: boolean;
  planName: string;
  coverageStart?: string;
  copay?: number;
  deductible?: number;
  /** Indicates which adapter produced this response */
  source: 'availity' | 'mock';
}

/**
 * Adapter contract — each concrete adapter must implement this interface.
 * Errors from the upstream service should be thrown as standard `Error`
 * instances; callers are responsible for handling them.
 */
export interface IEligibilityAdapter {
  checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse>;
}

/**
 * Factory that returns the appropriate adapter based on env vars.
 * Import the concrete adapters lazily so that modules without the optional
 * Availity dependency do not fail at import time.
 */
export async function createEligibilityAdapter(): Promise<IEligibilityAdapter> {
  const clientId = process.env['AVAILITY_CLIENT_ID'];
  const clientSecret = process.env['AVAILITY_CLIENT_SECRET'];

  if (clientId && clientSecret) {
    const { AvailityEligibilityAdapter } = await import('./AvailityEligibilityAdapter');
    return new AvailityEligibilityAdapter(clientId, clientSecret);
  }

  const { MockEligibilityAdapter } = await import('./MockEligibilityAdapter');
  return new MockEligibilityAdapter();
}
