export class Redactor {
  // Regex for potential PHI patterns
  private static readonly SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
  private static readonly EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  private static readonly PHONE_REGEX = /\b(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g;
  private static readonly DATE_REGEX = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g;

  /**
   * Redacts sensitive information from text.
   * @param text The input text to redact.
   * @returns The redacted text.
   */
  static redact(text: string): string {
    if (!text) return text;
    return text
      .replace(this.SSN_REGEX, '[REDACTED SSN]')
      .replace(this.EMAIL_REGEX, '[REDACTED EMAIL]')
      .replace(this.PHONE_REGEX, '[REDACTED PHONE]')
      .replace(this.DATE_REGEX, '[REDACTED DATE]');
  }

  /**
   * Checks if text contains potential PHI.
   * @param text The input text to check.
   * @returns True if potential PHI is found.
   */
  static hasPHI(text: string): boolean {
    return (
      this.SSN_REGEX.test(text) ||
      this.EMAIL_REGEX.test(text) ||
      this.PHONE_REGEX.test(text) ||
      this.DATE_REGEX.test(text)
    );
  }
}
