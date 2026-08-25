import { test as baseTest, expect as baseExpect } from '@common/fixtures/base.fixtures';
import { NetworkHandler, isAdOrTrackerUrl } from '@common/support/network-handler';
import { LoginPage } from '@ui/pages/account/login.page';
import { RegisterPage } from '@ui/pages/account/register.page';
import { BooksPage } from '@ui/pages/book-store/books.page';
import { BookDetailPage } from '@ui/pages/book-store/book-detail.page';
import { ProfilePage } from '@ui/pages/book-store/profile.page';

type UiOptions = {
  authenticated: boolean;
};

type UiFixtures = {
  blockAds: void;
  networkHandler: NetworkHandler;
  resetCollection: void;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  booksPage: BooksPage;
  bookDetailPage: BookDetailPage;
  profilePage: ProfilePage;
};

const test = baseTest.extend<UiOptions & UiFixtures>({
  authenticated: [false, { option: true }],

  storageState: async ({ authenticated, workerAuthState }, use) => {
    await use(authenticated ? workerAuthState : undefined);
  },

  blockAds: [
    async ({ page }, use) => {
      await page.route('**/*', (route) =>
        isAdOrTrackerUrl(route.request().url()) ? route.abort() : route.continue(),
      );
      await use();
    },
    { auto: true },
  ],

  networkHandler: [
    async ({ page }, use) => {
      await use(new NetworkHandler(page));
    },
    { auto: true },
  ],

  resetCollection: [
    async ({ authenticated, workerUser, bookStoreService }, use) => {
      if (authenticated) {
        const response = await bookStoreService.deleteAllBooks(workerUser.userId, workerUser.token);
        baseExpect(
          response.status,
          `Could not reset the collection of worker user ${workerUser.userId}`,
        ).toBe(204);
      }
      await use();
    },
    { auto: true },
  ],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  booksPage: async ({ page }, use) => {
    await use(new BooksPage(page));
  },

  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
});

export default test;
export const expect = test.expect;
