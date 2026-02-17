// Client-safe exports (Types and logic with no Node.js dependencies)
export * from './types/index';
export * from './utils/redactor';

// Server-specific exports should be imported directly from their files 
// to avoid bundling Node.js modules (like 'fs' or 'crypto') in the browser.
// Example: import { esClient } from '@careequity/core/dist/search/client';
