import { test, expect } from '../../../common/fixtures/fixtures';
import { assertRestResponseAndSchema, assertRestResponse } from '../../../common/helpers/api-assertions';
import { TestDataGenerator } from '../../../common/helpers/test-data-generator';

const CREATE_USER_SCHEMA = 'src/api/tests/account/schema/createUser.schema.json';

test.describe('Create User API', () => {
  test('Should create a new user with valid credentials', async ({ accountService }) => {
    const { username, password } = TestDataGenerator.generateUserCredentials();
    let userId = '';
    let token = '';

    await test.step('Act — POST /Account/v1/User with valid body', async () => {
      const response = await accountService.createUser(username, password);

      await test.step('Assert — status 201 and schema valid', async () => {
        await assertRestResponseAndSchema(response, CREATE_USER_SCHEMA, 201);
      });

      await test.step('Assert — returned username matches the request', async () => {
        expect(response.body.username).toBe(username);
        expect(response.body.userID).toBeTruthy();
        userId = response.body.userID;
      });
    });

    await test.step('Cleanup — generate token then delete user', async () => {
      const tokenResp = await accountService.generateToken(username, password);
      token = tokenResp.body.token as string;
      await accountService.deleteUser(userId, token);
    });
  });

  test('Should return 400 for a password that does not meet complexity requirements', async ({ accountService }) => {
    await test.step('Act — POST /Account/v1/User with weak password', async () => {
      const response = await accountService.createUser('some_test_user_xyz', 'weakpass');

      await test.step('Assert — status 400', async () => {
        assertRestResponse(response, 400);
      });
    });
  });

  test('Should return 400 when username is empty', async ({ accountService }) => {
    await test.step('Act — POST /Account/v1/User with empty username', async () => {
      const response = await accountService.createUser('', 'TestPass@1234!');

      await test.step('Assert — status 400', async () => {
        assertRestResponse(response, 400);
      });
    });
  });
});
