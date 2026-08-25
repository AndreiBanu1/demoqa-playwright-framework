import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus, assertStatusAndSchema } from '@api/support/api-assertions';
import { TestDataGenerator } from '@common/support/data-generator';
import createUserSchema from '@api/schemas/account/create-user.schema.json';

test.describe('Create User API', () => {
  test(
    'Should create a new user with valid credentials',
    { tag: '@smoke' },
    async ({ accountService }) => {
      const { username, password } = TestDataGenerator.generateUserCredentials();
      let userId = '';

      const response = await test.step('Act — POST /Account/v1/User with valid body', () =>
        accountService.createUser(username, password));

      await test.step('Assert — status 201 and schema valid', () => {
        assertStatusAndSchema(response, 201, createUserSchema);
      });

      await test.step('Assert — returned identity matches the request', () => {
        expect(response.body.username).toBe(username);
        expect(response.body.userID).toBeTruthy();
        expect(response.body.books).toEqual([]);
        userId = response.body.userID;
      });

      await test.step('Cleanup — generate token then delete user', async () => {
        const tokenResp = await accountService.generateToken(username, password);
        await accountService.deleteUser(userId, tokenResp.body.token as string);
      });
    },
  );

  test('Should return 400 for a password that does not meet complexity requirements', async ({
    accountService,
  }) => {
    const response = await test.step('Act — POST /Account/v1/User with weak password', () =>
      accountService.createUser(TestDataGenerator.generateUsername(), 'weakpass'));

    await test.step('Assert — status 400', () => {
      assertStatus(response, 400);
    });
  });

  test('Should return 400 when username is empty', async ({ accountService }) => {
    const { password } = TestDataGenerator.generateUserCredentials();

    const response = await test.step('Act — POST /Account/v1/User with empty username', () =>
      accountService.createUser('', password));

    await test.step('Assert — status 400', () => {
      assertStatus(response, 400);
    });
  });
});
