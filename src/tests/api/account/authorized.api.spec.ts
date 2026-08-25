import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus } from '@api/support/api-assertions';
import { TestDataGenerator } from '@common/support/data-generator';

const USER_NOT_FOUND_ERROR = { code: '1207', message: 'User not found!' };

test.describe('Authorized API', () => {
  let username = '';
  let password = '';
  let userId = '';
  let token = '';

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

  test('Should return true for valid credentials', async ({ accountService }) => {
    const response =
      await test.step('Act — POST /Account/v1/Authorized with valid credentials', () =>
        accountService.isAuthorized(username, password));

    await test.step('Assert — status 200 and body is true', () => {
      assertStatus(response, 200);
      expect(response.body).toBe(true);
    });
  });

  test('Should return 404 with code 1207 for a wrong password', async ({ accountService }) => {
    const response = await test.step('Act — POST /Account/v1/Authorized with wrong password', () =>
      accountService.isAuthorized(username, 'WrongPass@99!'));

    await test.step('Assert — status 404 with "User not found!" error body', () => {
      assertStatus(response, 404);
      expect(response.body).toEqual(USER_NOT_FOUND_ERROR);
    });
  });

  test('Should return 404 with code 1207 for a non-existent user', async ({ accountService }) => {
    const response =
      await test.step('Act — POST /Account/v1/Authorized with an unknown username', () =>
        accountService.isAuthorized(TestDataGenerator.generateUsername(), password));

    await test.step('Assert — status 404 with "User not found!" error body', () => {
      assertStatus(response, 404);
      expect(response.body).toEqual(USER_NOT_FOUND_ERROR);
    });
  });
});
