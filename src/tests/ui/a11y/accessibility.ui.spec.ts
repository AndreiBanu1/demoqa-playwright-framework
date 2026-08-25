import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';
import test, { expect } from '@common/fixtures/ui.fixtures';

const KNOWN_VIOLATIONS: ReadonlySet<string> = new Set([
  'image-alt',
  'link-name',
  'button-name',
  'color-contrast',
]);

const RELEVANT_IMPACTS: ReadonlySet<string> = new Set(['serious', 'critical']);

function summarise(violations: Result[]): string[] {
  return violations.map(
    (violation) =>
      `${violation.id} [${violation.impact}] x${violation.nodes.length} — ${violation.help}`,
  );
}

test.describe('Accessibility', { tag: '@a11y' }, () => {
  const scan = async (page: Page): Promise<void> => {
    const results = await new AxeBuilder({ page }).analyze();
    const relevant = results.violations.filter((violation) =>
      RELEVANT_IMPACTS.has(violation.impact ?? ''),
    );
    const ruleIds = relevant.map((violation) => violation.id);
    const unexpected = ruleIds.filter((id) => !KNOWN_VIOLATIONS.has(id));

    expect(
      unexpected,
      `New serious/critical accessibility violations:\n${summarise(relevant).join('\n')}`,
    ).toEqual([]);
  };

  test('Login page has no new serious or critical violations', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.expectPageLoaded();
    await scan(page);
  });

  test('Register page has no new serious or critical violations', async ({
    page,
    registerPage,
  }) => {
    await registerPage.goto();
    await registerPage.expectPageLoaded();
    await scan(page);
  });

  test('Books catalog has no new serious or critical violations', async ({ page, booksPage }) => {
    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await scan(page);
  });

  test('Book detail has no new serious or critical violations', async ({
    page,
    bookStoreService,
    bookDetailPage,
  }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);
    const [firstBook] = catalog.body.books;

    await bookDetailPage.goto(firstBook.isbn);
    await bookDetailPage.expectPageLoaded();
    await scan(page);
  });
});
