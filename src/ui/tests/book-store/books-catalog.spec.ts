import test, { expect } from '../../page-objects/page-setup';

const EXPECTED_BOOK_COUNT = 8;
const KNOWN_ISBN = '9781449325862';
const KNOWN_TITLE = 'Git Pocket Guide';

test.describe('Books Catalog', () => {
  test('Should render the catalog with expected columns and row count', async ({
    networkHandler,
    booksPage,
  }) => {
    void networkHandler;
    await booksPage.goto();
    await booksPage.expectPageLoaded();

    await test.step('Column headers are all present', async () => {
      await booksPage.expectColumnHeaders(['Image', 'Title', 'Author', 'Publisher']);
    });

    await test.step('The catalog renders the expected number of book rows', async () => {
      await booksPage.expectRowCount(EXPECTED_BOOK_COUNT);
    });
  });

  test('Should fire GET /BookStore/v1/Books on load with an 8-book catalog', async ({
    page,
    networkHandler,
    booksPage,
  }) => {
    void networkHandler;

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/BookStore/v1/Books') && r.request().method() === 'GET',
    );
    await booksPage.goto();
    const response = await responsePromise;
    await booksPage.expectPageLoaded();

    expect(response.status()).toBe(200);
    const body = (await response.json()) as { books: Array<{ isbn: string }> };
    expect(body.books.length).toBe(EXPECTED_BOOK_COUNT);
    expect(body.books.some((b) => b.isbn === KNOWN_ISBN)).toBe(true);
  });

  test('Should navigate to book detail when clicking a title link', async ({
    page,
    networkHandler,
    booksPage,
    bookDetailPage,
  }) => {
    void networkHandler;
    await booksPage.goto();
    await booksPage.expectPageLoaded();

    await test.step('Click the known title link', async () => {
      await booksPage.clickBookTitle(KNOWN_TITLE);
    });

    await test.step('URL contains ?search=<ISBN> and detail view renders', async () => {
      await page.waitForURL(new RegExp(`/books\\?search=${KNOWN_ISBN}$`));
      await bookDetailPage.expectPageLoaded();
      await bookDetailPage.expectIsbn(KNOWN_ISBN);
    });
  });

  test('Should show an unauthenticated Login button on the catalog header', async ({
    networkHandler,
    booksPage,
  }) => {
    void networkHandler;
    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await booksPage.expectLoginButtonVisible();
  });

  test('Should render pagination controls', async ({ networkHandler, booksPage }) => {
    void networkHandler;
    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await booksPage.expectPaginationControlsVisible();
  });
});
