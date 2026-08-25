import test, { expect } from '@common/fixtures/ui.fixtures';
import { expectNoRequest, requestMatching } from '@common/support/request-assertions';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.expectPageLoaded();
  });

  test(
    'Should log in with valid credentials and land on /profile',
    { tag: '@smoke' },
    async ({ page, networkHandler, loginPage, profilePage, freshUser }) => {
      const tokenResponsePromise = page.waitForResponse(
        (r) => r.url().includes('/Account/v1/GenerateToken') && r.request().method() === 'POST',
      );
      const loginResponsePromise = page.waitForResponse(
        (r) => r.url().includes('/Account/v1/Login') && r.request().method() === 'POST',
      );

      await test.step("Submit the worker user's credentials", async () => {
        await loginPage.submitCredentials(freshUser.username, freshUser.password);
      });

      await test.step('Token and Login endpoints both succeed', async () => {
        const tokenResponse = await tokenResponsePromise;
        expect(tokenResponse.status()).toBe(200);
        const tokenBody = (await tokenResponse.json()) as { status: string; token: string | null };
        expect(tokenBody.status).toBe('Success');
        expect(tokenBody.token).not.toBeNull();

        const loginResponse = await loginResponsePromise;
        expect(loginResponse.status()).toBe(200);
        const loginBody = (await loginResponse.json()) as { userId: string; username: string };
        expect(loginBody.userId).toBe(freshUser.userId);
        expect(loginBody.username).toBe(freshUser.username);
      });

      await test.step('URL becomes /profile and username is displayed', async () => {
        await page.waitForURL('**/profile');
        await profilePage.expectPageLoaded();
        await profilePage.expectUsername(freshUser.username);
      });

      networkHandler.expectNoServerErrors();
    },
  );

  test('Should surface "Invalid username or password!" for bad credentials', async ({
    page,
    loginPage,
  }) => {
    const tokenResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/Account/v1/GenerateToken') && r.request().method() === 'POST',
    );

    await expectNoRequest(
      page,
      requestMatching('/Account/v1/Login', 'POST'),
      async () => {
        await test.step('Submit invalid credentials', async () => {
          await loginPage.submitCredentials('__notauser__', 'WrongPass1!');
        });

        await test.step('GenerateToken returns 200 with Failed status', async () => {
          const tokenResponse = await tokenResponsePromise;
          expect(tokenResponse.status()).toBe(200);
          const body = (await tokenResponse.json()) as { status: string; token: string | null };
          expect(body.status).toBe('Failed');
          expect(body.token).toBeNull();
        });

        await test.step('Error message appears and URL stays on /login', async () => {
          await loginPage.expectInvalidCredentialsError();
          await expect(page).toHaveURL(/\/login/);
        });
      },
      'A rejected token must not be followed by a call to /Account/v1/Login',
    );
  });

  test('Should navigate to /register when clicking New User', async ({ page, loginPage }) => {
    await loginPage.clickNewUser();
    await expect(page).toHaveURL(/\/register/);
  });
});
