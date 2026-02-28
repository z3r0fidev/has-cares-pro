// Export all modules for package-level imports
export * from './search/client';
export * from './utils/redactor';
export * from './utils/auth';
export * from './utils/scraper';
export { AIModerator } from './utils/moderator';
export * from './types/index';
export * from './logger/index';

// Insurance eligibility
export type { EligibilityRequest, EligibilityResponse, IEligibilityAdapter } from './insurance/EligibilityService';
export { createEligibilityAdapter } from './insurance/EligibilityService';
export { MockEligibilityAdapter } from './insurance/MockEligibilityAdapter';
export { AvailityEligibilityAdapter } from './insurance/AvailityEligibilityAdapter';

// FHIR availability
export type { AvailabilitySlot, IFhirAdapter } from './fhir/FhirAvailabilityService';
export { mergeSlots, nextSevenDays } from './fhir/FhirAvailabilityService';
export { FhirClient } from './fhir/FhirClient';
export type { FhirBundle, FhirClientOptions } from './fhir/FhirClient';
export { EpicFhirAdapter } from './fhir/EpicFhirAdapter';
export { AthenahealthAdapter } from './fhir/AthenahealthAdapter';
