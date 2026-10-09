import { Page, Response, expect } from '@playwright/test';
import { baseLogger as log } from '../../observability/logger';

export const AD_AND_TRACKER_PATTERNS: readonly RegExp[] = [
  /googlesyndication\.com/i,
  /googleadservices\.com/i,
  /googletagservices\.com/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
  /adservice\.google\./i,
  /adtrafficquality\.google/i,
  /fundingchoicesmessages\.google/i,
  /doubleclick\.net/i,
  /securepubads\./i,
  /admaster\.cc/i,
  /adsystem/i,
  /pagead/i,
];

const UNBLOCKED_THIRD_PARTY_PATTERNS: readonly RegExp[] = [/recaptcha/i, /gstatic\.com/i];

export const IGNORED_RESPONSE_PATTERNS: readonly RegExp[] = [
  ...AD_AND_TRACKER_PATTERNS,
  ...UNBLOCKED_THIRD_PARTY_PATTERNS,
];

export function isAdOrTrackerUrl(url: string): boolean {
  return AD_AND_TRACKER_PATTERNS.some((pattern) => pattern.test(url));
}

export interface NetworkHandlerOptions {
  ignoreUrlPatterns?: RegExp[];
}

export interface CapturedError {
  url: string;
  status: number;
  method: string;
}

export class NetworkHandler {
  private readonly errors: CapturedError[] = [];
  private readonly ignore: RegExp[];

  constructor(page: Page, options: NetworkHandlerOptions = {}) {
    this.ignore = [...IGNORED_RESPONSE_PATTERNS, ...(options.ignoreUrlPatterns ?? [])];

    page.on('response', (response) => this.handleResponse(response));
  }

  public getErrors(): CapturedError[] {
    return [...this.errors];
  }

  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  public clear(): void {
    this.errors.length = 0;
  }

  public expectNoServerErrors(allow: RegExp[] = []): void {
    const unexpected = this.errors
      .filter((error) => !allow.some((pattern) => pattern.test(error.url)))
      .map((error) => `${error.method} ${error.status} ${error.url}`);

    expect(unexpected, 'Page received unexpected backend error responses').toEqual([]);
  }

  private handleResponse(response: Response): void {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();
    if (this.ignore.some((pattern) => pattern.test(url))) return;

    const error: CapturedError = {
      url,
      status,
      method: response.request().method(),
    };
    this.errors.push(error);

    const { host, pathname } = new URL(url);
    log.warn({
      event: 'page_http_error',
      method: error.method,
      status: error.status,
      host,
      path: pathname,
    });
  }
}
