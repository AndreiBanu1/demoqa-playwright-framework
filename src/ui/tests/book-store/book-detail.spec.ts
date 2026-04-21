import test, { expect } from '../../page-objects/page-setup';

const KNOWN_ISBN = '9781449325862';
const UNKNOWN_ISBN = '0000000000';

test.describe('Book Detail — unauthenticated', () => {
  test.beforeEach(async ({ networkHandler }) => {
    void networkHandler;
  });

  test('Should render all metadata for a known ISBN via deep link', async ({ bookDetailPage }) => {
    await bookDetailPage.goto(KNOWN_ISBN);
    await bookDetailPage.expectPageLoaded();

    await test.step('All detail fields show the expected values', async () => {
      await bookDetailPage.expectIsbn(KNOWN_ISBN);
      await bookDetailPage.expectTitle('Git Pocket Guide');
      await bookDetailPage.expectSubtitle('A Working Introduction');
      await bookDetailPage.expectAuthor('Richard E. Silverman');
      await bookDetailPage.expectPublisher("O'Reilly Media");
      await bookDetailPage.expectPages('234');
      await bookDetailPage.expectDescriptionStartsWith(
        'This pocket guide is the perfect on-the-job companion to Git',
      );
      await bookDetailPage.expectWebsite(
        'http://chimera.labs.oreilly.com/books/1230000000561/index.html',
      );
    });

    await test.step('Unauthenticated: Login visible, Add button hidden', async () => {
      await bookDetailPage.expectLoginButtonVisible();
      await bookDetailPage.expectAddButtonHidden();
    });
  });

  test('Should return to the catalog via "Back To Book Store"', async ({ page, bookDetailPage, booksPage }) => {
    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await booksPage.clickBookTitle('Git Pocket Guide');
    await bookDetailPage.expectPageLoaded();

    await bookDetailPage.clickBack();

    await expect(page).toHaveURL(/\/books(?!\?search=)/);
    await booksPage.expectPageLoaded();
  });

  test('Should handle an unknown ISBN in the URL without crashing', async ({ page, bookDetailPage, booksPage }) => {
    const jsErrors: Error[] = [];
    page.on('pageerror', (err) => jsErrors.push(err));

    await bookDetailPage.goto(UNKNOWN_ISBN);
    await booksPage.expectPageLoaded();

    expect(page.url()).toContain(`search=${UNKNOWN_ISBN}`);
    expect(jsErrors).toHaveLength(0);
  });
});

test.describe('Book Detail — authenticated', () => {
  test.beforeEach(async ({ networkHandler, cleanAdminCollection, authenticatedPage }) => {
    void networkHandler;
    void cleanAdminCollection;
    void authenticatedPage;
  });

  test('Should show "Add To Your Collection" when authenticated', async ({ bookDetailPage }) => {
    await bookDetailPage.goto(KNOWN_ISBN);
    await bookDetailPage.expectPageLoaded();
    await bookDetailPage.expectAddButtonVisible();
  });

  test('Should add a book to the user collection when clicking Add', async ({ page, bookDetailPage }) => {
    await bookDetailPage.goto(KNOWN_ISBN);
    await bookDetailPage.expectPageLoaded();

    const alertPromise = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    const addResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/BookStore/v1/Books') &&
        r.request().method() === 'POST',
    );

    await bookDetailPage.clickAddToCollection();

    await test.step('POST returns 201 with the added ISBN', async () => {
      const response = await addResponsePromise;
      expect(response.status()).toBe(201);
      const body = (await response.json()) as { books: Array<{ isbn: string }> };
      expect(body.books[0].isbn).toBe(KNOWN_ISBN);
    });

    await test.step('Browser alert matches the exact success text', async () => {
      const message = await alertPromise;
      expect(message).toBe('Book added to your collection.');
    });
  });

  test('Should alert duplicate-present text when adding the same book twice', async ({
    page,
    bookStoreService,
    bookDetailPage,
    testConfig,
    adminToken,
  }) => {
    await test.step('Seed the collection with the book via API', async () => {
      const seed = await bookStoreService.addBooks(
        { userId: testConfig.userId, collectionOfIsbns: [{ isbn: KNOWN_ISBN }] },
        adminToken,
      );
      expect(seed.status).toBe(201);
    });

    await bookDetailPage.goto(KNOWN_ISBN);
    await bookDetailPage.expectPageLoaded();

    const alertPromise = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    const addResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes('/BookStore/v1/Books') &&
        r.request().method() === 'POST',
    );

    await bookDetailPage.clickAddToCollection();

    await test.step('POST returns 400 with code 1210', async () => {
      const response = await addResponsePromise;
      expect(response.status()).toBe(400);
      const body = (await response.json()) as { code: string; message: string };
      expect(body.code).toBe('1210');
      expect(body.message).toBe("ISBN already present in the User's Collection!");
    });

    await test.step('Alert surfaces the duplicate message (typo preserved)', async () => {
      const message = await alertPromise;
      expect(message).toBe('Book already present in the your collection!');
    });
  });
});
