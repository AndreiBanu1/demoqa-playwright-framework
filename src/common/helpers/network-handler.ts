import { Page, Response } from '@playwright/test';

export interface NetworkHandlerOptions {
  throwOnError?: boolean;
  logErrors?: boolean;
  ignoreUrlPatterns?: RegExp[];
}

export interface CapturedError {
  url: string;
  status: number;
  method: string;
}

const DEFAULT_IGNORE: RegExp[] = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /googlesyndication\.com/i,
  /doubleclick\.net/i,
  /adservice\.google/i,
  /recaptcha/i,
  /gstatic\.com/i,
  /pagead/i,
  /fundingchoicesmessages/i,
];

export class NetworkHandler {
  private readonly errors: CapturedError[] = [];
  private readonly ignore: RegExp[];
  private readonly logErrors: boolean;
  private readonly throwOnError: boolean;

  constructor(page: Page, options: NetworkHandlerOptions = {}) {
    this.ignore = [...DEFAULT_IGNORE, ...(options.ignoreUrlPatterns ?? [])];
    this.logErrors = options.logErrors ?? true;
    this.throwOnError = options.throwOnError ?? false;

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

  private handleResponse(response: Response): void {
    const status = response.status();
    if (status < 400) return;

    const url = response.url();
    if (this.ignore.some((re) => re.test(url))) return;

    const error: CapturedError = {
      url,
      status,
      method: response.request().method(),
    };
    this.errors.push(error);

    if (this.logErrors) {
      console.warn(`[networkHandler] ${error.method} ${error.status} ${error.url}`);
    }

    if (this.throwOnError) {
      throw new Error(`Unexpected backend error: ${error.method} ${error.status} ${error.url}`);
    }
  }
}
