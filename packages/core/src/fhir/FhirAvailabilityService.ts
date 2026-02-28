/**
 * Unified FHIR availability types and service interface.
 *
 * FhirAvailabilityService is a thin coordinator: it delegates to
 * EpicFhirAdapter and AthenahealthAdapter and merges their results,
 * deduplicating by start time.
 */

export interface AvailabilitySlot {
  /** ISO 8601 datetime string, e.g. "2026-03-01T09:00:00Z" */
  start: string;
  /** ISO 8601 datetime string */
  end: string;
  status: 'free' | 'busy';
  source: 'epic' | 'athenahealth' | 'manual';
}

export interface IFhirAdapter {
  /**
   * Fetch available appointment slots for a provider NPI on a specific date.
   * Implementors MUST return an empty array (never throw) when their
   * environment variables are absent.
   */
  getSlots(providerNpi: string, date: string): Promise<AvailabilitySlot[]>;
}

/**
 * Merges slot arrays from multiple adapters, deduplicating by start time.
 * Earlier adapters in the list win on duplicate start times.
 */
export function mergeSlots(slotArrays: AvailabilitySlot[][]): AvailabilitySlot[] {
  const seen = new Set<string>();
  const merged: AvailabilitySlot[] = [];

  for (const slots of slotArrays) {
    for (const slot of slots) {
      if (!seen.has(slot.start)) {
        seen.add(slot.start);
        merged.push(slot);
      }
    }
  }

  // Sort chronologically
  merged.sort((a, b) => a.start.localeCompare(b.start));
  return merged;
}

/**
 * Returns an array of ISO date strings for today through today + 7 days.
 */
export function nextSevenDays(): string[] {
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
  }
  return dates;
}
