import test, { expect } from '@common/fixtures/ui.fixtures';
import { Book } from '@api/services/book-store.service';

test.describe('Books Catalog', () => {
  test(
    'Should render every book the API returns, with the expected columns',
    { tag: '@smoke' },
    async ({ bookStoreService, networkHandler, booksPage }) => {
      const catalog = await bookStoreService.getBooks();
      expect(catalog.status).toBe(200);
      const books: Book[] = catalog.body.books;
      expect(books.length, 'API returned an empty catalog').toBeGreaterThan(0);

      await booksPage.goto();
      await booksPage.expectPageLoaded();

      await test.step('Column headers are all present', async () => {
        await booksPage.expectColumnHeaders(['Image', 'Title', 'Author', 'Publisher']);
      });

      await test.step('One row per API book, titles in API order', async () => {
        await booksPage.expectRowCount(books.length);
        await booksPage.expectTitles(books.map((book) => book.title));
      });

      networkHandler.expectNoServerErrors();
    },
  );

  test('Should fire GET /BookStore/v1/Books on load and render that exact payload', async ({
    page,
    booksPage,
  }) => {
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/BookStore/v1/Books') && r.request().method() === 'GET',
    );
    await booksPage.goto();
    const response = await responsePromise;
    await booksPage.expectPageLoaded();

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { books: Book[] };
    expect(body.books.length).toBeGreaterThan(0);

    await test.step('Rendered titles match the intercepted response', async () => {
      await booksPage.expectTitles(body.books.map((book) => book.title));
    });
  });

  test('Should navigate to book detail when clicking a title link', async ({
    page,
    bookStoreService,
    booksPage,
    bookDetailPage,
  }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);
    const [firstBook] = catalog.body.books;
    expect(firstBook, 'API returned an empty catalog').toBeDefined();

    await booksPage.goto();
    await booksPage.expectPageLoaded();

    await test.step(`Click the "${firstBook.title}" title link`, async () => {
      await booksPage.clickBookTitle(firstBook.title);
    });

    await test.step('URL contains ?search=<ISBN> and detail view renders', async () => {
      await expect(page).toHaveURL(new RegExp(`/books\\?search=${firstBook.isbn}$`));
      await bookDetailPage.expectPageLoaded();
      await bookDetailPage.expectDetails({ isbn: firstBook.isbn, title: firstBook.title });
    });
  });

  test('Should show an unauthenticated Login button on the catalog header', async ({
    booksPage,
  }) => {
    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await booksPage.expectLoginButtonVisible();
  });

  test('Should render a single-page pagination footer with both buttons disabled', async ({
    bookStoreService,
    booksPage,
  }) => {
    const catalog = await bookStoreService.getBooks();
    expect(catalog.status).toBe(200);

    await booksPage.goto();
    await booksPage.expectPageLoaded();

    await booksPage.expectRowCount(catalog.body.books.length);
    await booksPage.expectPaginationState({
      previousEnabled: false,
      nextEnabled: false,
      currentPage: 1,
      totalPages: 1,
    });
  });
});
