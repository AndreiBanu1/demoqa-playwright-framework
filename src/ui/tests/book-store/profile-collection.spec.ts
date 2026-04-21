import test, { expect } from '../../page-objects/page-setup';

const ISBN_A = '9781449325862';
const TITLE_A = 'Git Pocket Guide';
const ISBN_B = '9781449331818';
const TITLE_B = 'Learning JavaScript Design Patterns';

test.describe('Profile — unauthenticated', () => {
  test.beforeEach(async ({ networkHandler }) => {
    void networkHandler;
  });

  test('Should show the unauth banner on /profile without a token', async ({ page, profilePage }) => {
    await profilePage.goto();
    await profilePage.expectPageLoaded();

    await test.step('URL stays at /profile (no redirect)', async () => {
      expect(page.url()).toContain('/profile');
    });

    await test.step('Unauth banner is visible with the expected copy and links', async () => {
      await profilePage.expectUnauthBannerVisible();
      await profilePage.expectUnauthBannerHasAuthLinks();
    });
  });
});

test.describe('Profile — authenticated', () => {
  test.beforeEach(async ({ networkHandler, cleanAdminCollection, authenticatedPage }) => {
    void networkHandler;
    void cleanAdminCollection;
    void authenticatedPage;
  });

  test('Should display the username and an empty collection after wipe', async ({
    page,
    profilePage,
    testConfig,
  }) => {
    const userResponsePromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/Account/v1/User/${testConfig.userId}`) &&
        r.request().method() === 'GET',
    );
    await profilePage.reloadPage();

    await test.step('GET /Account/v1/User/:userId fires with 200', async () => {
      const response = await userResponsePromise;
      expect(response.status()).toBe(200);
    });

    await profilePage.expectPageLoaded();

    await test.step('Username equals the admin account', async () => {
      await profilePage.expectUsername(testConfig.username);
    });

    await test.step('Collection is empty and action buttons are visible', async () => {
      await profilePage.expectRowCount(0);
      await profilePage.expectAuthenticatedView();
    });
  });

  test('Should list books after seeding the collection via the API', async ({
    bookStoreService,
    profilePage,
    testConfig,
    adminToken,
  }) => {
    await test.step('Seed the collection with two books', async () => {
      const response = await bookStoreService.addBooks(
        {
          userId: testConfig.userId,
          collectionOfIsbns: [{ isbn: ISBN_A }, { isbn: ISBN_B }],
        },
        adminToken,
      );
      expect(response.status).toBe(201);
    });

    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(2);
  });

  test('Should delete a single row via the row icon + modal OK', async ({
    page,
    bookStoreService,
    profilePage,
    testConfig,
    adminToken,
  }) => {
    await test.step('Seed the book', async () => {
      await bookStoreService.addBooks(
        { userId: testConfig.userId, collectionOfIsbns: [{ isbn: ISBN_A }] },
        adminToken,
      );
    });

    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(1);

    const deleteResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/BookStore/v1/Book') && r.request().method() === 'DELETE',
    );

    await test.step('Click delete icon and confirm via modal', async () => {
      await profilePage.clickDeleteRow(ISBN_A);
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
    testConfig,
    adminToken,
  }) => {
    await bookStoreService.addBooks(
      { userId: testConfig.userId, collectionOfIsbns: [{ isbn: ISBN_A }] },
      adminToken,
    );
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(1);

    let deleteFired = false;
    const listener = (request: { url: () => string; method: () => string }): void => {
      if (request.url().includes('/BookStore/v1/Book') && request.method() === 'DELETE') {
        deleteFired = true;
      }
    };
    page.on('request', listener);

    await profilePage.clickDeleteRow(ISBN_A);
    await profilePage.deleteModal.expectVisible();
    await profilePage.deleteModal.clickCancel();

    await profilePage.deleteModal.expectHidden();
    await profilePage.expectRowCount(1);

    page.off('request', listener);
    expect(deleteFired).toBe(false);
  });

  test('Should delete the entire collection via "Delete All Books"', async ({
    page,
    bookStoreService,
    profilePage,
    testConfig,
    adminToken,
  }) => {
    await bookStoreService.addBooks(
      {
        userId: testConfig.userId,
        collectionOfIsbns: [{ isbn: ISBN_A }, { isbn: ISBN_B }],
      },
      adminToken,
    );
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(2);

    const deleteAllPromise = page.waitForResponse(
      (r) =>
        r.url().includes(`/BookStore/v1/Books`) &&
        r.url().includes(`UserId=${testConfig.userId}`) &&
        r.request().method() === 'DELETE',
    );

    await profilePage.clickDeleteAllBooks();
    await profilePage.deleteModal.expectVisible();
    await profilePage.deleteModal.expectTitle('Delete All Books');
    await profilePage.deleteModal.expectBodyContains('Do you want to delete all books?');
    await profilePage.deleteModal.clickOk();

    const response = await deleteAllPromise;
    expect(response.status()).toBe(204);
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(0);
  });

  test('Should navigate to the catalog via "Go To Book Store"', async ({ page, profilePage, booksPage }) => {
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();

    await profilePage.clickGoToBookStore();
    await page.waitForURL('**/books');
    await booksPage.expectPageLoaded();
  });

  test('Should log out without a backend call and return to /login', async ({ page, profilePage }) => {
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();

    let backendCallFired = false;
    const listener = (request: { url: () => string; method: () => string }): void => {
      if (
        request.url().includes('demoqa.com/Account') ||
        request.url().includes('demoqa.com/BookStore')
      ) {
        backendCallFired = true;
      }
    };
    page.on('request', listener);

    await profilePage.clickLogout();

    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');

    page.off('request', listener);
    expect(backendCallFired).toBe(false);
  });

  test('Should navigate to book detail when clicking a collection row link', async ({
    page,
    bookStoreService,
    profilePage,
    bookDetailPage,
    testConfig,
    adminToken,
  }) => {
    await bookStoreService.addBooks(
      { userId: testConfig.userId, collectionOfIsbns: [{ isbn: ISBN_A }] },
      adminToken,
    );
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();

    await profilePage.clickSeeBookLink(TITLE_A);

    await page.waitForURL(new RegExp(`/books\\?search=${ISBN_A}$`));
    await bookDetailPage.expectPageLoaded();
    await bookDetailPage.expectIsbn(ISBN_A);
  });

  test('Should filter the collection table via the profile search box', async ({
    bookStoreService,
    profilePage,
    testConfig,
    adminToken,
  }) => {
    await bookStoreService.addBooks(
      {
        userId: testConfig.userId,
        collectionOfIsbns: [{ isbn: ISBN_A }, { isbn: ISBN_B }],
      },
      adminToken,
    );
    await profilePage.reloadPage();
    await profilePage.expectPageLoaded();
    await profilePage.expectRowCount(2);

    await profilePage.searchCollection('Git');
    await profilePage.expectRowCount(1);

    await profilePage.clearSearch();
    await profilePage.expectRowCount(2);

    expect(TITLE_B.length).toBeGreaterThan(0);
  });
});
