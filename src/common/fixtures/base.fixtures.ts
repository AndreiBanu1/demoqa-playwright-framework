import { test as base, expect, request } from '@playwright/test';
import type { PlaywrightTestOptions } from '@playwright/test';
import { HttpClient } from '@common/support/http-client';
import { TestConfig, loadTestConfig } from '@common/config/test-config';
import { TestDataGenerator } from '@common/support/data-generator';
import { AccountService } from '@api/services/account.service';
import { BookStoreService } from '@api/services/book-store.service';

export interface TestUser {
  userId: string;
  username: string;
  password: string;
  token: string;
  expires: string;
}

export type StorageState = Exclude<NonNullable<PlaywrightTestOptions['storageState']>, string>;

type CoreFixtures = {
  httpClient: HttpClient;
  accountService: AccountService;
  bookStoreService: BookStoreService;
  freshUser: TestUser;
};

type CoreWorkerFixtures = {
  testConfig: TestConfig;
  workerUser: TestUser;
  workerAuthState: StorageState;
};

function toStorageState(user: TestUser, baseURL: string): StorageState {
  const domain = new URL(baseURL).hostname;
  const cookie = (name: string, value: string) => ({
    name,
    value,
    domain,
    path: '/',
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  });

  return {
    cookies: [
      cookie('token', user.token),
      cookie('expires', user.expires),
      cookie('userID', user.userId),
      cookie('userName', user.username),
    ],
    origins: [],
  };
}

function logUserLifecycle(message: string): void {
  if (process.env.LOG_WORKER_USERS) {
    console.log(message);
  }
}

async function provisionUser(
  accountService: AccountService,
  username: string,
  password: string,
): Promise<TestUser> {
  const created = await accountService.createUser(username, password);
  expect(
    created.status,
    `Could not provision user ${username}: ${JSON.stringify(created.body)}`,
  ).toBe(201);

  const tokenResponse = await accountService.generateToken(username, password);
  expect(
    tokenResponse.status,
    `Could not generate a token for ${username}: ${JSON.stringify(tokenResponse.body)}`,
  ).toBe(200);
  expect(
    tokenResponse.body.token,
    `GenerateToken returned a null token for ${username}`,
  ).not.toBeNull();

  return {
    userId: created.body.userID,
    username,
    password,
    token: tokenResponse.body.token as string,
    expires: tokenResponse.body.expires ?? '',
  };
}

async function decommissionUser(accountService: AccountService, user: TestUser): Promise<void> {
  try {
    const refreshed = await accountService.generateToken(user.username, user.password);
    const deleted = await accountService.deleteUser(
      user.userId,
      refreshed.body.token ?? user.token,
    );
    if (deleted.status >= 400) {
      console.warn(
        `Failed to delete user ${user.userId} (status ${deleted.status}); it may linger.`,
      );
    } else {
      logUserLifecycle(
        `user deleted id=${user.userId} name=${user.username} status=${deleted.status}`,
      );
    }
  } catch (error) {
    console.warn(
      `Failed to delete user ${user.userId}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export const test = base.extend<CoreFixtures, CoreWorkerFixtures>({
  testConfig: [
    async ({}, use) => {
      await use(loadTestConfig());
    },
    { scope: 'worker' },
  ],

  workerUser: [
    async ({ testConfig }, use, workerInfo) => {
      const apiContext = await request.newContext({ baseURL: testConfig.baseURL });
      const accountService = new AccountService(new HttpClient(testConfig, apiContext));
      const { username, password } = TestDataGenerator.generateUserCredentials(
        `${testConfig.userPrefix}w${workerInfo.workerIndex}`,
      );

      try {
        const user = await provisionUser(accountService, username, password);
        logUserLifecycle(
          `worker-user created worker=${workerInfo.workerIndex} id=${user.userId} name=${user.username}`,
        );

        await use(user);

        await decommissionUser(accountService, user);
      } finally {
        await apiContext.dispose();
      }
    },
    { scope: 'worker' },
  ],

  workerAuthState: [
    async ({ testConfig, workerUser }, use) => {
      await use(toStorageState(workerUser, testConfig.baseURL));
    },
    { scope: 'worker' },
  ],

  httpClient: async ({ testConfig, request: requestContext }, use) => {
    await use(new HttpClient(testConfig, requestContext));
  },
  accountService: async ({ httpClient }, use) => {
    await use(new AccountService(httpClient));
  },
  bookStoreService: async ({ httpClient }, use) => {
    await use(new BookStoreService(httpClient));
  },

  freshUser: async ({ accountService, testConfig }, use, testInfo) => {
    const { username, password } = TestDataGenerator.generateUserCredentials(
      `${testConfig.userPrefix}t${testInfo.workerIndex}`,
    );
    const user = await provisionUser(accountService, username, password);
    logUserLifecycle(
      `fresh-user created worker=${testInfo.workerIndex} id=${user.userId} name=${user.username}`,
    );

    await use(user);

    await decommissionUser(accountService, user);
  },
});

export { expect } from '@playwright/test';
