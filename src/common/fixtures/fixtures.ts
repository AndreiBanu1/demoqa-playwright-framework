import { test as base } from '@playwright/test';
import { HttpClient } from '../helpers/http-client';
import { TestConfig, loadTestConfig } from '../config/test-config';
import { AccountService } from '../../api/services/accountService';
import { BookStoreService } from '../../api/services/bookStoreService';

type CoreFixtures = {
  testConfig: TestConfig;
  httpClient: HttpClient;
  accountService: AccountService;
  bookStoreService: BookStoreService;
};

export const test = base.extend<CoreFixtures>({
  testConfig: async ({}, use) => {
    await use(loadTestConfig());
  },
  httpClient: async ({ testConfig, request }, use) => {
    await use(new HttpClient(testConfig, request));
  },
  accountService: async ({ httpClient }, use) => {
    await use(new AccountService(httpClient));
  },
  bookStoreService: async ({ httpClient }, use) => {
    await use(new BookStoreService(httpClient));
  },
});

export { expect } from '@playwright/test';
