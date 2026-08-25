import test, { expect } from '@common/fixtures/ui.fixtures';
import { Book, BookStoreService } from '@api/services/book-store.service';
import { expectNoRequest, requestMatching } from '@common/support/request-assertions';

async function catalogBooks(service: BookStoreService, count: number): Promise<Book[]> {
  const response = await service.getBooks();
  expect(response.status).toBe(200);
  expect(
    response.body.books.length,
    `catalog needs at least ${count} books to seed this test`,
  ).toBeGreaterThanOrEqual(count);
  return response.body.books.slice(0, count);
}

test.describe('Profile — unauthenticated', () => {
  test('Should show the unauth banner on /profile without a token', async ({
    page,
    networkHandler,
    profilePage,
  }) => {
    await profilePage.goto();
    await profilePage.expectPageLoaded();

    await test.step('URL stays at /profile (no redirect)', async () => {
      await expect(page).toHaveURL(/\/profile/);
    });

    await test.step('Unauth banner is visible with the expected copy and links', async () => {
      await profilePage.expectUnauthBannerVisible();
      await profilePage.expectUnauthBannerHasAuthLinks();
    });

    networkHandler.expectNoServerErrors();
  });
});

test.describe('Profile — authenticated', () => {
  test.use({ authenticated: true });

  test('Should display the username and an empty collection after wipe', async ({
    page,
    profilePage,
    workerUser,
  }) => {
    const userResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/Account/v1/User/${workerUser.userId}`) && r.request().method() === 'GET',
    );
    await profilePage.goto();

    await test.step('GET /Account/v1/User/:userId fires with 200', async () => {
      const response = await userResponsePromise;
      expect(response.status()).toBe(200);
    });

    await profilePage.expectPageLoaded();

    await test.step("Username equals the worker's own account", async () => {
      await profilePage.expectUsername(workerUser.username);
    });

    await test.step('Collection is empty and action buttons are visible', async () => {
      await profilePage.expectRowCount(0);
      await profilePage.expectAuthenticatedView();
    });
  });

  test('Should list books after seeding the collection via the API', async ({
    bookStoreService,
    profilePage,
    workerUser,
  }) => {
    const books = await catalogBooks(bookStoreService, 2);

    await test.step('Seed the collection with two books', async () => {
      const response = await bookStoreService.addBooks(
        {
          userId: workerUser.userId,
          collectionOfIsbns: books.map((book) => ({ isbn: book.isbn })),
        },
        workerUser.token,
      );
      expect(response.status).toBe(201);
    });

    await profilePage.goto();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(books.length);
  });

  test('Should delete a single row via the row icon + modal OK', async ({
    page,
    bookStoreService,
    profilePage,
    workerUser,
  }) => {
    const [book] = await catalogBooks(bookStoreService, 1);

    await test.step('Seed the book', async () => {
      await bookStoreService.addBooks(
        { userId: workerUser.userId, collectionOfIsbns: [{ isbn: book.isbn }] },
        workerUser.token,
      );
    });

    await profilePage.goto();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(1);

    const deleteResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/BookStore/v1/Book') && r.request().method() === 'DELETE',
    );

    await test.step('Click delete icon and confirm via modal', async () => {
      await profilePage.clickDeleteRow(book.isbn);
      await profilePage.deleteModal.expectVisible();
      await profilePage.deleteModal.expectTitle('Delete Book');
      await profilePage.deleteModal.expectBodyContains('Do you want to delete this book?');
      await profilePage.deleteModal.clickOk();
    });

    await test.step('DELETE returns 204 and row disappears', async () => {
      const response = await deleteResponsePromise;
      expect(response.status()).toBe(204);
      await profilePage.deleteModal.expectHidden();
      await profilePage.expectRowCount(0);
    });
  });

  test('Should cancel a row delete via the modal Cancel button', async ({
    page,
    bookStoreService,
    profilePage,
    workerUser,
  }) => {
    const [book] = await catalogBooks(bookStoreService, 1);
    await bookStoreService.addBooks(
      { userId: workerUser.userId, collectionOfIsbns: [{ isbn: book.isbn }] },
      workerUser.token,
    );
    await profilePage.goto();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(1);

    await expectNoRequest(
      page,
      requestMatching('/BookStore/v1/Book', 'DELETE'),
      async () => {
        await profilePage.clickDeleteRow(book.isbn);
        await profilePage.deleteModal.expectVisible();
        await profilePage.deleteModal.clickCancel();

        await profilePage.deleteModal.expectHidden();
        await profilePage.expectRowCount(1);
      },
      'Cancelling the modal must not send a DELETE',
    );
  });

  test('Should delete the entire collection via "Delete All Books"', async ({
    page,
    bookStoreService,
    profilePage,
    workerUser,
  }) => {
    const books = await catalogBooks(bookStoreService, 2);
    await bookStoreService.addBooks(
      {
        userId: workerUser.userId,
        collectionOfIsbns: books.map((book) => ({ isbn: book.isbn })),
      },
      workerUser.token,
    );
    await profilePage.goto();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(books.length);

    const deleteAllPromise = page.waitForResponse(
      (r) =>
        r.url().includes('/BookStore/v1/Books') &&
        r.url().includes(`UserId=${workerUser.userId}`) &&
        r.request().method() === 'DELETE',
    );

    await profilePage.clickDeleteAllBooks();
    await profilePage.deleteModal.expectVisible();
    await profilePage.deleteModal.expectTitle('Delete All Books');
    await profilePage.deleteModal.expectBodyContains('Do you want to delete all books?');
    await profilePage.deleteModal.clickOk();

    const response = await deleteAllPromise;
    expect(response.status()).toBe(204);

    // A genuine refresh: the emptied collection must survive a reload, not just
    // disappear from the client-side table.
    await page.reload();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(0);
  });

  test('Should navigate to the catalog via "Go To Book Store"', async ({
    page,
    profilePage,
    booksPage,
  }) => {
    await profilePage.goto();
    await profilePage.expectPageLoaded();

    await profilePage.clickGoToBookStore();
    await page.waitForURL('**/books');
    await booksPage.expectPageLoaded();
  });

  test('Should log out without a backend call and return to /login', async ({
    page,
    profilePage,
  }) => {
    await profilePage.goto();
    await profilePage.expectPageLoaded();

    await expectNoRequest(
      page,
      (request) =>
        request.url().includes('demoqa.com/Account') ||
        request.url().includes('demoqa.com/BookStore'),
      async () => {
        await profilePage.clickLogout();
        await page.waitForURL('**/login');
        await expect(page).toHaveURL(/\/login/);
      },
      'Logout is client-side only and must not call the backend',
    );
  });

  test('Should navigate to book detail when clicking a collection row link', async ({
    page,
    bookStoreService,
    profilePage,
    bookDetailPage,
    workerUser,
  }) => {
    const [book] = await catalogBooks(bookStoreService, 1);
    await bookStoreService.addBooks(
      { userId: workerUser.userId, collectionOfIsbns: [{ isbn: book.isbn }] },
      workerUser.token,
    );
    await profilePage.goto();
    await profilePage.expectPageLoaded();

    await profilePage.clickSeeBookLink(book.title);

    await expect(page).toHaveURL(new RegExp(`/books\\?search=${book.isbn}$`));
    await bookDetailPage.expectPageLoaded();
    await bookDetailPage.expectDetails({ isbn: book.isbn, title: book.title });
  });

  test('Should filter the collection table via the profile search box', async ({
    bookStoreService,
    profilePage,
    workerUser,
  }) => {
    const books = await catalogBooks(bookStoreService, 2);
    await bookStoreService.addBooks(
      {
        userId: workerUser.userId,
        collectionOfIsbns: books.map((book) => ({ isbn: book.isbn })),
      },
      workerUser.token,
    );
    await profilePage.goto();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(2);

    const needle = books[0].title.split(' ')[0];
    const expectedMatches = books.filter((book) =>
      book.title.toLowerCase().includes(needle.toLowerCase()),
    ).length;
    expect(
      expectedMatches,
      `"${needle}" matches every seeded book, so it cannot prove filtering`,
    ).toBeLessThan(books.length);

    await profilePage.searchCollection(needle);
    await profilePage.expectRowCount(expectedMatches);

    await profilePage.clearSearch();
    await profilePage.expectRowCount(2);
  });
});
