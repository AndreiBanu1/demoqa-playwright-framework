import test, { expect } from '@common/fixtures/ui.fixtures';

const ANCHOR_ISBN = '9781449325862';

const UNKNOWN_ISBN = '0000000000';

test.describe('Book Detail — unauthenticated', () => {
  test(
    'Should render every metadata field exactly as the API returns it',
    { tag: '@smoke' },
    async ({ bookStoreService, networkHandler, bookDetailPage }) => {
      const { status, body: book } = await bookStoreService.getBook(ANCHOR_ISBN);
      expect(status, `anchor ISBN ${ANCHOR_ISBN} is no longer in the catalog`).toBe(200);

      await bookDetailPage.goto(ANCHOR_ISBN);
      await bookDetailPage.expectPageLoaded();

      await test.step('Every rendered field matches the API payload', async () => {
        await bookDetailPage.expectDetails({
          isbn: book.isbn,
          title: book.title,
          subtitle: book.subTitle,
          author: book.author,
          publisher: book.publisher,
          pages: String(book.pages),
          website: book.website,
          description: { contains: book.description },
        });
      });

      await test.step('Unauthenticated: Login visible, Add button hidden', async () => {
        await bookDetailPage.expectLoginButtonVisible();
        await bookDetailPage.expectAddButtonHidden();
      });

      networkHandler.expectNoServerErrors();
    },
  );

  test('Should return to the catalog via "Back To Book Store"', async ({
    page,
    bookStoreService,
    bookDetailPage,
    booksPage,
  }) => {
    const { status, body: book } = await bookStoreService.getBook(ANCHOR_ISBN);
    expect(status).toBe(200);

    await booksPage.goto();
    await booksPage.expectPageLoaded();
    await booksPage.clickBookTitle(book.title);
    await bookDetailPage.expectPageLoaded();

    await bookDetailPage.clickBack();

    await expect(page).toHaveURL(/\/books(?!\?search=)/);
    await booksPage.expectPageLoaded();
  });

  test('Should handle an unknown ISBN in the URL without crashing', async ({
    page,
    networkHandler,
    bookDetailPage,
    booksPage,
  }) => {
    const jsErrors: Error[] = [];
    page.on('pageerror', (err) => jsErrors.push(err));

    await bookDetailPage.goto(UNKNOWN_ISBN);
    await booksPage.expectPageLoaded();

    await expect(page).toHaveURL(new RegExp(`search=${UNKNOWN_ISBN}`));
    expect(jsErrors, 'unknown ISBN must not throw in the browser').toEqual([]);

    const expectedFailure = new RegExp(`/BookStore/v1/Book\\?ISBN=${UNKNOWN_ISBN}`);
    await expect
      .poll(
        () =>
          networkHandler
            .getErrors()
            .filter((error) => expectedFailure.test(error.url))
            .map((error) => error.status),
        { message: 'the unknown-ISBN lookup should be recorded as a 400', timeout: 10_000 },
      )
      .toContain(400);

    networkHandler.expectNoServerErrors([expectedFailure]);
  });
});

test.describe('Book Detail — authenticated', () => {
  test.use({ authenticated: true });

  test('Should show "Add To Your Collection" when authenticated', async ({ bookDetailPage }) => {
    await bookDetailPage.goto(ANCHOR_ISBN);
    await bookDetailPage.expectPageLoaded();
    await bookDetailPage.expectAddButtonVisible();
  });

  test(
    'Should add a book to the user collection when clicking Add',
    { tag: '@smoke' },
    async ({ page, bookDetailPage }) => {
      await bookDetailPage.goto(ANCHOR_ISBN);
      await bookDetailPage.expectPageLoaded();

      const alertPromise = new Promise<string>((resolve) => {
        page.once('dialog', async (dialog) => {
          const message = dialog.message();
          await dialog.accept();
          resolve(message);
        });
      });

      const addResponsePromise = page.waitForResponse(
        (r) => r.url().includes('/BookStore/v1/Books') && r.request().method() === 'POST',
      );

      await bookDetailPage.clickAddToCollection();

      await test.step('POST returns 201 with the added ISBN', async () => {
        const response = await addResponsePromise;
        expect(response.status()).toBe(201);
        const body = (await response.json()) as { books: Array<{ isbn: string }> };
        expect(body.books[0].isbn).toBe(ANCHOR_ISBN);
      });

      await test.step('Browser alert matches the exact success text', async () => {
        const message = await alertPromise;
        expect(message).toBe('Book added to your collection.');
      });
    },
  );

  test('Should alert duplicate-present text when adding the same book twice', async ({
    page,
    bookStoreService,
    bookDetailPage,
    workerUser,
  }) => {
    await test.step('Seed the collection with the book via API', async () => {
      const seed = await bookStoreService.addBooks(
        { userId: workerUser.userId, collectionOfIsbns: [{ isbn: ANCHOR_ISBN }] },
        workerUser.token,
      );
      expect(seed.status).toBe(201);
    });

    await bookDetailPage.goto(ANCHOR_ISBN);
    await bookDetailPage.expectPageLoaded();

    const alertPromise = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });

    const addResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/BookStore/v1/Books') && r.request().method() === 'POST',
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
