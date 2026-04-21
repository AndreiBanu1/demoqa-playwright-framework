import test, { expect } from '../../page-objects/page-setup';

const TOTAL_BOOKS = 8;

test.describe('Books Search', () => {
  test.beforeEach(async ({ networkHandler, booksPage }) => {
    void networkHandler;
    await booksPage.goto();
    await booksPage.expectPageLoaded();
  });

  test('Should filter rows by title substring', async ({ booksPage }) => {
    await test.step('Type "Git" into the search box', async () => {
      await booksPage.searchBooks('Git');
    });

    await test.step('All visible rows contain "Git" in the title', async () => {
      await booksPage.expectAllTitlesContain('Git');
    });

    await test.step('Clearing the search restores the full catalog', async () => {
      await booksPage.clearSearch();
      await booksPage.expectRowCount(TOTAL_BOOKS);
    });
  });

  test('Should filter by author substring', async ({ booksPage }) => {
    await booksPage.searchBooks('Osmani');
    await booksPage.expectRowCount(1);
    const titles = await booksPage.getVisibleTitles();
    expect(titles[0]).toBe('Learning JavaScript Design Patterns');
  });

  test('Should not fire a network call while typing', async ({ page, booksPage }) => {
    const networkCalls: string[] = [];
    const listener = (request: { url: () => string }): void => {
      if (request.url().includes('/BookStore/v1/Books')) {
        networkCalls.push(request.url());
      }
    };
    page.on('request', listener);

    await booksPage.searchBooks('Git');
    await booksPage.expectAllTitlesContain('Git');

    page.off('request', listener);
    expect(networkCalls.length).toBe(0);
  });

  test('Should show an empty body when no row matches', async ({ booksPage }) => {
    await booksPage.searchBooks('zzzzzzzz');
    await booksPage.expectEmptyResults();
  });
});
