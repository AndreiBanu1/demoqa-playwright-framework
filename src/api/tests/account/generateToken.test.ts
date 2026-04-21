import { test, expect } from '../../../common/fixtures/fixtures';
import { assertRestResponseAndSchema, assertRestResponse } from '../../../common/helpers/api-assertions';
import { TestDataGenerator } from '../../../common/helpers/test-data-generator';

const GENERATE_TOKEN_SCHEMA = 'src/api/tests/account/schema/generateToken.schema.json';

test.describe('Generate Token API', () => {
  test('Should return a valid token for correct credentials', async ({ accountService }) => {
    const { username, password } = TestDataGenerator.generateUserCredentials();
    let userId = '';
    let token = '';

    await test.step('Arrange — create a fresh user', async () => {
      const createResp = await accountService.createUser(username, password);
      assertRestResponse(createResp, 201);
      userId = createResp.body.userID;
    });

    await test.step('Act — generate token', async () => {
      const tokenResp = await accountService.generateToken(username, password);
      await assertRestResponseAndSchema(tokenResp, GENERATE_TOKEN_SCHEMA, 200);
      expect(tokenResp.body.token).not.toBeNull();
      expect(tokenResp.body.status).toBe('Success');
      token = tokenResp.body.token as string;
    });

    await test.step('Cleanup — delete the test user', async () => {
      await accountService.deleteUser(userId, token);
    });
  });

  test('Should return null token with Failed status for invalid credentials', async ({ accountService }) => {
    await test.step('Act — generate token with wrong password', async () => {
      const response = await accountService.generateToken('nonexistent_user_xyz', 'WrongPass@99!');

      await test.step('Assert — status 200 with failure body', async () => {
        assertRestResponse(response, 200);
        expect(response.body.status).toBe('Failed');
        expect(response.body.token).toBeNull();
      });
    });
  });
});
