/**
 * FhirClient — thin FHIR R4 REST client.
 *
 * Works with any FHIR R4-compliant server. Authentication is handled by the
 * caller (pass a Bearer token via the `accessToken` option). The client
 * performs a typed GET request against a FHIR resource URL and returns the
 * parsed JSON body.
 *
 * No external dependencies — uses the Node.js / browser built-in `fetch`.
 */

export interface FhirClientOptions {
  baseUrl: string;
  /** Optional pre-obtained Bearer token */
  accessToken?: string;
}

/** Minimal FHIR Bundle shape we care about */
export interface FhirBundle<T> {
  resourceType: 'Bundle';
  entry?: Array<{ resource?: T }>;
  total?: number;
}

/** Minimal FHIR OperationOutcome for error detection */
export interface FhirOperationOutcome {
  resourceType: 'OperationOutcome';
  issue: Array<{ severity: string; diagnostics?: string }>;
}

export class FhirClient {
  private readonly baseUrl: string;
  private accessToken: string | undefined;

  constructor(options: FhirClientOptions) {
    // Strip trailing slash so callers can freely include or omit it
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.accessToken = options.accessToken;
  }

  /** Replace or set the Bearer token (e.g. after a token refresh) */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Perform a typed GET against a FHIR resource or search endpoint.
   * @param path  Relative path, e.g. `/Schedule?actor=Practitioner/1234`
   * @returns     Parsed JSON response body cast to T
   * @throws      Error when the HTTP status is not 2xx or the body is a
   *              FHIR OperationOutcome with severity "error" / "fatal"
   */
  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: 'application/fhir+json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`FHIR GET ${url} failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as T;

    // Surface FHIR-level errors that are returned with a 200 status
    if (
      data !== null &&
      typeof data === 'object' &&
      'resourceType' in data &&
      (data as { resourceType: unknown }).resourceType === 'OperationOutcome'
    ) {
      const outcome = data as unknown as FhirOperationOutcome;
      const fatal = outcome.issue.find((i) => i.severity === 'error' || i.severity === 'fatal');
      if (fatal) {
        throw new Error(`FHIR OperationOutcome: ${fatal.diagnostics ?? fatal.severity}`);
      }
    }

    return data;
  }
}
