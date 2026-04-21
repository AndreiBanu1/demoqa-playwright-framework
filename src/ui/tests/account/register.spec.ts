import test, { expect } from '../../page-objects/page-setup';
import { TestDataGenerator } from '../../../common/helpers/test-data-generator';

test.describe('Register (smoke)', () => {
  test.beforeEach(async ({ networkHandler, registerPage }) => {
    void networkHandler;
    await registerPage.goto();
    await registerPage.expectPageLoaded();
  });

  test('Should render the registration form with a reCAPTCHA widget', async ({ registerPage }) => {
    await test.step('All four text inputs are visible', async () => {
      await registerPage.expectFormFieldsVisible();
    });

    await test.step('reCAPTCHA iframe is embedded', async () => {
      await registerPage.expectRecaptchaVisible();
    });

    await test.step('Register and Back to Login buttons are visible', async () => {
      await registerPage.expectActionButtonsVisible();
    });
  });

  test('Should navigate to /login via "Back to Login"', async ({ page, registerPage }) => {
    await registerPage.clickBackToLogin();
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('Should block registration submit when reCAPTCHA is not solved', async ({
    page,
    registerPage,
  }) => {
    const { username, password } = TestDataGenerator.generateUserCredentials();

    await registerPage.fillRegistrationForm('Test', 'User', username, password);

    const createUserAttempt = page
      .waitForRequest(
        (req) => req.url().endsWith('/Account/v1/User') && req.method() === 'POST',
        { timeout: 3000 },
      )
      .catch(() => null);

    await registerPage.clickRegister();

    expect(await createUserAttempt).toBeNull();
    expect(page.url()).toContain('/register');
  });
});
