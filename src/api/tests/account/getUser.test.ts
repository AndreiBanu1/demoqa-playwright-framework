import { test, expect } from '../../../common/fixtures/fixtures';
import { assertRestResponseAndSchema, assertRestResponse } from '../../../common/helpers/api-assertions';
import { TestDataGenerator } from '../../../common/helpers/test-data-generator';

const GET_USER_SCHEMA = 'src/api/tests/account/schema/getUser.schema.json';

test.describe('Get User API', () => {
  let userId = '';
  let token = '';
  let username = '';
  let password = '';

  test.beforeAll(async ({ accountService }) => {
    const creds = TestDataGenerator.generateUserCredentials();
    username = creds.username;
    password = creds.password;

    const createResp = await accountService.createUser(username, password);
    userId = createResp.body.userID;

    const tokenResp = await accountService.generateToken(username, password);
    token = tokenResp.body.token as string;
  });

  test.afterAll(async ({ accountService }) => {
    if (userId && token) {
      await accountService.deleteUser(userId, token);
    }
  });

  test('Should return user details for an authenticated request', async ({ accountService }) => {
    await test.step('Act — GET /Account/v1/User/{userId} with valid token', async () => {
      const response = await accountService.getUser(userId, token);

      await test.step('Assert — status 200 and schema valid', async () => {
        await assertRestResponseAndSchema(response, GET_USER_SCHEMA, 200);
      });

      await test.step('Assert — response contains correct user identity', async () => {
        expect(response.body.userId).toBe(userId);
        expect(response.body.username).toBe(username);
        expect(Array.isArray(response.body.books)).toBe(true);
      });
    });
  });

  test('Should return 401 for an unauthenticated request', async ({ accountService }) => {
    await test.step('Act — GET /Account/v1/User/{userId} with no token', async () => {
      const response = await accountService.getUser(userId, '');

      await test.step('Assert — status 401', async () => {
        assertRestResponse(response, 401);
      });
    });
  });

  test('Should return 401 for a request with an invalid token', async ({ accountService }) => {
    await test.step('Act — GET /Account/v1/User/{userId} with invalid token', async () => {
      const response = await accountService.getUser(userId, 'invalid.token.value');

      await test.step('Assert — status 401', async () => {
        assertRestResponse(response, 401);
      });
    });
  });
});
