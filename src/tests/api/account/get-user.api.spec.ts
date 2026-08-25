import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus, assertStatusAndSchema } from '@api/support/api-assertions';
import { TestDataGenerator } from '@common/support/data-generator';
import getUserSchema from '@api/schemas/account/get-user.schema.json';

const SAMPLE_ISBN = '9781449325862';

test.describe('Get User API', () => {
  let userId = '';
  let token = '';
  let username = '';

  test.beforeAll(async ({ accountService, bookStoreService }) => {
    const creds = TestDataGenerator.generateUserCredentials();
    username = creds.username;

    const createResp = await accountService.createUser(username, creds.password);
    userId = createResp.body.userID;

    const tokenResp = await accountService.generateToken(username, creds.password);
    token = tokenResp.body.token as string;

    await bookStoreService.addBooks({ userId, collectionOfIsbns: [{ isbn: SAMPLE_ISBN }] }, token);
  });

  test.afterAll(async ({ accountService }) => {
    if (userId && token) {
      await accountService.deleteUser(userId, token);
    }
  });

  test('Should return user details for an authenticated request', async ({ accountService }) => {
    const response = await test.step('Act — GET /Account/v1/User/{userId} with valid token', () =>
      accountService.getUser(userId, token));

    await test.step('Assert — status 200 and schema valid', () => {
      assertStatusAndSchema(response, 200, getUserSchema);
    });

    await test.step('Assert — response contains correct user identity and seeded book', () => {
      expect(response.body.userId).toBe(userId);
      expect(response.body.username).toBe(username);
      expect(response.body.books.map((book) => book.isbn)).toContain(SAMPLE_ISBN);
    });
  });

  test('Should return 401 for an unauthenticated request', async ({ accountService }) => {
    const response = await test.step('Act — GET /Account/v1/User/{userId} with no token', () =>
      accountService.getUser(userId, ''));

    await test.step('Assert — status 401', () => {
      assertStatus(response, 401);
    });
  });

  test('Should return 401 for a request with an invalid token', async ({ accountService }) => {
    const response = await test.step('Act — GET /Account/v1/User/{userId} with invalid token', () =>
      accountService.getUser(userId, 'invalid.token.value'));

    await test.step('Assert — status 401', () => {
      assertStatus(response, 401);
    });
  });
});
