import test, { expect } from '../../page-objects/page-setup';

test.describe('Login', () => {
  test.beforeEach(async ({ networkHandler, loginPage }) => {
    void networkHandler;
    await loginPage.goto();
    await loginPage.expectPageLoaded();
  });

  test('Should log in with valid credentials and land on /profile', async ({
    page,
    loginPage,
    profilePage,
    testConfig,
  }) => {
    const tokenResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/Account/v1/GenerateToken') && r.request().method() === 'POST',
    );
    const loginResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/Account/v1/Login') && r.request().method() === 'POST',
    );

    await test.step('Submit admin credentials', async () => {
      await loginPage.submitCredentials(testConfig.username, testConfig.password);
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
      expect(loginBody.userId).toBe(testConfig.userId);
      expect(loginBody.username).toBe(testConfig.username);
    });

    await test.step('URL becomes /profile and username is displayed', async () => {
      await page.waitForURL('**/profile');
      await profilePage.expectPageLoaded();
      await profilePage.expectUsername(testConfig.username);
    });
  });

  test('Should surface "Invalid username or password!" for bad credentials', async ({
    page,
    loginPage,
  }) => {
    let loginRequestFired = false;
    const loginListener = (request: { url: () => string; method: () => string }): void => {
      if (request.url().includes('/Account/v1/Login') && request.method() === 'POST') {
        loginRequestFired = true;
      }
    };
    page.on('request', loginListener);

    const tokenResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/Account/v1/GenerateToken') && r.request().method() === 'POST',
    );

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
      expect(page.url()).toContain('/login');
    });

    page.off('request', loginListener);
    expect(loginRequestFired).toBe(false);
  });

  test('Should navigate to /register when clicking New User', async ({ page, loginPage }) => {
    await loginPage.clickNewUser();
    await page.waitForURL('**/register');
    expect(page.url()).toContain('/register');
  });
});
