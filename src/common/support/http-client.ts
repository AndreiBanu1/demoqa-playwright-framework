import { APIRequestContext, APIResponse } from '@playwright/test';
import { TestConfig } from '@common/config/test-config';
import { baseLogger as log } from '../../observability/logger';

export interface ApiResponse<T> {
  status: number;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

interface RequestOptions {
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export class HttpClient {
  constructor(
    private readonly config: TestConfig,
    private readonly request: APIRequestContext,
  ) {}

  public get<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('GET', path, options);
  }

  public post<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('POST', path, options);
  }

  public put<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('PUT', path, options);
  }

  public delete<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    return this.send<T>('DELETE', path, options);
  }

  private async send<T>(
    method: string,
    path: string,
    options: RequestOptions,
  ): Promise<ApiResponse<T>> {
    const url = path.startsWith('http') ? path : `${this.config.baseURL}${path}`;
    const start = Date.now();
    let response: APIResponse;
    try {
      response = await this.request.fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...options.headers,
        },
        data: options.body as Record<string, unknown>,
      });
    } catch (error) {
      log.warn({
        event: 'api_call_error',
        method,
        path: new URL(url).pathname,
        durationMs: Date.now() - start,
        err: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    log.debug({
      event: 'api_call',
      method,
      path: new URL(url).pathname,
      status: response.status(),
      durationMs: Date.now() - start,
    });
    const contentType = response.headers()['content-type'] ?? '';
    const body: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return {
      status: response.status(),
      headers: response.headers(),
      body: body as T,
      raw: response,
    };
  }
}
