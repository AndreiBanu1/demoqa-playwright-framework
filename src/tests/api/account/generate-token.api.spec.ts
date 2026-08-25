import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus, assertStatusAndSchema } from '@api/support/api-assertions';
import { TestDataGenerator } from '@common/support/data-generator';
import generateTokenSchema from '@api/schemas/account/generate-token.schema.json';

test.describe('Generate Token API', () => {
  test(
    'Should return a valid token for correct credentials',
    { tag: '@smoke' },
    async ({ accountService }) => {
      const { username, password } = TestDataGenerator.generateUserCredentials();
      let userId = '';

      await test.step('Arrange — create a fresh user', async () => {
        const createResp = await accountService.createUser(username, password);
        assertStatus(createResp, 201);
        userId = createResp.body.userID;
      });

      const response = await test.step('Act — POST /Account/v1/GenerateToken', () =>
        accountService.generateToken(username, password));

      await test.step('Assert — status 200 and schema valid', () => {
        assertStatusAndSchema(response, 200, generateTokenSchema);
      });

      await test.step('Assert — authorization succeeded', () => {
        expect(response.body.token).not.toBeNull();
        expect(response.body.status).toBe('Success');
      });

      await test.step('Cleanup — delete the test user', async () => {
        await accountService.deleteUser(userId, response.body.token as string);
      });
    },
  );

  test('Should return null token with Failed status for invalid credentials', async ({
    accountService,
  }) => {
    const response = await test.step('Act — POST /Account/v1/GenerateToken with unknown user', () =>
      accountService.generateToken(TestDataGenerator.generateUsername(), 'WrongPass@99!'));

    await test.step('Assert — status 200 with failure body', () => {
      assertStatus(response, 200);
      expect(response.body.status).toBe('Failed');
      expect(response.body.token).toBeNull();
      expect(response.body.expires).toBeNull();
    });
  });
});
