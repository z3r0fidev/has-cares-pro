// Export all modules for package-level imports
export * from './search/client';
export * from './utils/redactor';
export * from './utils/auth';
export * from './utils/scraper';
// AIModerator is server-only (uses TensorFlow) - import directly from '@careequity/core/src/utils/moderator'
// logger is server-only (uses winston/fs) - import directly from '@careequity/core/src/logger'
export * from './types/index';

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
