import { Redactor } from '../redactor';

describe('Redactor', () => {
  it('should redact SSN', () => {
    const input = 'My SSN is 123-45-6789';
    expect(Redactor.redact(input)).toBe('My SSN is [REDACTED SSN]');
  });

  it('should redact Email', () => {
    const input = 'Contact me at test@example.com';
    expect(Redactor.redact(input)).toBe('Contact me at [REDACTED EMAIL]');
  });

  it('should redact Phone', () => {
    const input = 'Call 555-555-5555';
    expect(Redactor.redact(input)).toBe('Call [REDACTED PHONE]');
  });

  it('should redact Date', () => {
    const input = 'DOB is 01/01/2000';
    expect(Redactor.redact(input)).toBe('DOB is [REDACTED DATE]');
  });

  it('should handle empty string', () => {
    expect(Redactor.redact('')).toBe('');
  });
});
