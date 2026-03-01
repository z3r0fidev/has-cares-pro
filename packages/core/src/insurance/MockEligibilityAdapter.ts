/**
 * MockEligibilityAdapter
 *
 * Deterministic mock for development and CI environments.
 * Behaviour rules (predictable for tests):
 *  - Members whose ID starts with "INELIGIBLE" are returned as not covered.
 *  - All other member IDs are considered eligible.
 *  - Copay and deductible are derived from the plan code so that different
 *    plans produce different numbers — useful for UI testing.
 */

import type { IEligibilityAdapter, EligibilityRequest, EligibilityResponse } from './EligibilityService';

/** Map of known test-member IDs to their mock plan names */
const KNOWN_MEMBERS: Record<string, string> = {
  MEM001: 'Aetna Choice POS II',
  MEM002: 'Blue Cross Blue Shield PPO',
  MEM003: 'Cigna Open Access Plus',
  MEM004: 'UnitedHealthcare Choice Plus',
  MEM005: 'Humana Choice PPO',
};

/**
 * Derives a stable copay value from a plan code string using a simple hash.
 * Returns a value in the range [10, 50] dollars.
 */
function planCopay(planCode: string): number {
  let hash = 0;
  for (let i = 0; i < planCode.length; i++) {
    hash = (hash * 31 + planCode.charCodeAt(i)) & 0xffff;
  }
  return 10 + (hash % 41); // 10–50
}

/**
 * Derives a stable deductible value from a plan code string.
 * Returns a value in the range [500, 5000] dollars in $250 steps.
 */
function planDeductible(planCode: string): number {
  let hash = 0;
  for (let i = 0; i < planCode.length; i++) {
    hash = (hash * 17 + planCode.charCodeAt(i)) & 0xffff;
  }
  return 500 + ((hash % 19) * 250); // 500–5250
}

export class MockEligibilityAdapter implements IEligibilityAdapter {
  async checkEligibility(request: EligibilityRequest): Promise<EligibilityResponse> {
    // Simulate a short network round-trip so callers build in async handling
    await new Promise<void>((resolve) => setTimeout(resolve, 50));

    const ineligible = request.memberId.toUpperCase().startsWith('INELIGIBLE');

    if (ineligible) {
      return {
        eligible: false,
        planName: 'Unknown Plan',
        source: 'mock',
      };
    }

    const planName =
      KNOWN_MEMBERS[request.memberId] ??
      `Mock Plan (${request.insurancePlanCode})`;

    // Coverage start is always Jan 1 of the current year for mock responses
    const coverageStart = `${new Date().getFullYear()}-01-01`;

    return {
      eligible: true,
      planName,
      coverageStart,
      copay: planCopay(request.insurancePlanCode),
      deductible: planDeductible(request.insurancePlanCode),
      source: 'mock',
    };
  }
}
