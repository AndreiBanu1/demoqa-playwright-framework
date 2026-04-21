import { Page } from '@playwright/test';
import { test as baseTest } from '../../common/fixtures/fixtures';
import { NetworkHandler } from '../../common/helpers/network-handler';
import { LoginPage } from './account/login-page';
import { RegisterPage } from './account/register-page';
import { BooksPage } from './book-store/books-page';
import { BookDetailPage } from './book-store/book-detail-page';
import { ProfilePage } from './book-store/profile-page';
import { LoginFlow } from '../flows/login';

type UiFixtures = {
  networkHandler: NetworkHandler;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  booksPage: BooksPage;
  bookDetailPage: BookDetailPage;
  profilePage: ProfilePage;
  loginFlow: LoginFlow;
  authenticatedPage: Page;
  adminToken: string;
  cleanAdminCollection: void;
};

const AD_HOSTS = [
  'googlesyndication.com',
  'doubleclick.net',
  'googletagmanager.com',
  'google-analytics.com',
  'adservice.google.com',
  'googleadservices.com',
  'googletagservices.com',
  'adtrafficquality.google',
  'fundingchoicesmessages.google.com',
  'admaster.cc',
  'pagead2.googlesyndication.com',
  'pagead',
  'securepubads',
  'ep2.adtrafficquality',
  'static.doubleclick',
  'adsystem',
];

const test = baseTest.extend<UiFixtures>({
  networkHandler: async ({ page }, use) => {
    await page.route('**/*', (route) => {
      const url = route.request().url();
      if (AD_HOSTS.some((h) => url.includes(h))) {
        return route.abort();
      }
      return route.continue();
    });
    const handler = new NetworkHandler(page, { throwOnError: false, logErrors: false });
    await use(handler);
  },

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

  loginFlow: async ({ page, loginPage, accountService, testConfig }, use) => {
    await use(new LoginFlow(page, loginPage, accountService, testConfig));
  },

  cleanAdminCollection: async ({ bookStoreService, loginFlow, testConfig }, use) => {
    const ephemeralToken = await loginFlow.getAdminToken();
    await bookStoreService.deleteAllBooks(testConfig.userId, ephemeralToken);
    await use();
  },

  authenticatedPage: async ({ page, loginFlow, cleanAdminCollection }, use) => {
    void cleanAdminCollection;
    const token = await loginFlow.loginAsAdminViaUi();
    (page as Page & { __adminToken?: string }).__adminToken = token;
    await use(page);
  },

  adminToken: async ({ page, loginFlow }, use) => {
    const cached = (page as Page & { __adminToken?: string }).__adminToken;
    const token = cached ?? (await loginFlow.getAdminToken());
    await use(token);
  },
});

export default test;
export const expect = test.expect;
