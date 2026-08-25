import { Page, Request, expect } from '@playwright/test';

export type RequestMatcher = (request: Request) => boolean;

export function requestMatching(urlPart: string, method?: string): RequestMatcher {
  return (request) =>
    request.url().includes(urlPart) &&
    (method === undefined || request.method() === method.toUpperCase());
}

export async function expectNoRequest(
  page: Page,
  matcher: RequestMatcher,
  action: () => Promise<void>,
  message = 'Expected no matching network request to be fired',
): Promise<void> {
  const matched: string[] = [];
  const listener = (request: Request): void => {
    if (matcher(request)) {
      matched.push(`${request.method()} ${request.url()}`);
    }
  };

  page.on('request', listener);
  try {
    await action();
  } finally {
    page.off('request', listener);
  }

  expect(matched, message).toEqual([]);
}
