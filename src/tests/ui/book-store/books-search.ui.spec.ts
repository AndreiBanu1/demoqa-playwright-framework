import test, { expect } from '@common/fixtures/ui.fixtures';
import { Book } from '@api/services/book-store.service';
import { expectNoRequest, requestMatching } from '@common/support/request-assertions';

const NO_MATCH_QUERY = 'zzzzzzzz';

function firstWord(text: string): string {
  return text.split(' ')[0];
}

test.describe('Books Search', () => {
  test.beforeEach(async ({ booksPage }) => {
    await booksPage.goto();
    await booksPage.expectPageLoaded();
  });

  test('Should filter rows by title substring', async ({ bookStoreService, booksPage }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);
    const books: Book[] = catalog.body.books;
    expect(books.length).toBeGreaterThan(0);

    const needle = firstWord(books[0].title);
    const expectedTitles = books
      .filter((book) => book.title.toLowerCase().includes(needle.toLowerCase()))
      .map((book) => book.title);

    await test.step(`Type "${needle}" into the search box`, async () => {
      await booksPage.searchBooks(needle);
    });

    await test.step('Exactly the matching titles remain', async () => {
      await booksPage.expectAllTitlesContain(needle);
      await booksPage.expectTitles(expectedTitles);
    });

    await test.step('Clearing the search restores the full catalog', async () => {
      await booksPage.clearSearch();
      await booksPage.expectRowCount(books.length);
    });
  });

  test('Should filter by author substring', async ({ bookStoreService, booksPage }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);
    const books: Book[] = catalog.body.books;
    expect(books.length).toBeGreaterThan(0);

    // Surname of the catalog's first author, plus every book that author wrote.
    const surname = books[0].author.split(' ').slice(-1)[0];
    const expectedTitles = books
      .filter((book) => book.author.includes(surname))
      .map((book) => book.title);

    await booksPage.searchBooks(surname);
    await booksPage.expectTitles(expectedTitles);
  });

  test('Should not fire a network call while typing', async ({
    page,
    bookStoreService,
    booksPage,
  }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);
    const needle = firstWord(catalog.body.books[0].title);

    await expectNoRequest(
      page,
      requestMatching('/BookStore/v1/Books'),
      async () => {
        await booksPage.searchBooks(needle);
        await booksPage.expectAllTitlesContain(needle);
      },
      'Search filtering is client-side and must not re-query /BookStore/v1/Books',
    );
  });

  test('Should show an empty body when no row matches', async ({ booksPage }) => {
    await booksPage.searchBooks(NO_MATCH_QUERY);
    await booksPage.expectEmptyResults();
  });
});
