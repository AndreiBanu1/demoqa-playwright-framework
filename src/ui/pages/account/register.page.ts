import { Locator, Page, expect } from '@playwright/test';
import { LoadablePage } from '@ui/pages/loadable-page';
import { expectAllVisible } from '@ui/support/page-assertions';

export class RegisterPage implements LoadablePage {
  private readonly page: Page;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly userNameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly recaptchaFrame: Locator;
  private readonly registerButton: Locator;
  private readonly backToLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.getByPlaceholder('First Name');
    this.lastNameInput = page.getByPlaceholder('Last Name');
    this.userNameInput = page.getByPlaceholder('UserName');
    this.passwordInput = page.getByPlaceholder('Password');
    this.recaptchaFrame = page.locator('iframe[src*="recaptcha"]').first();
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.backToLoginButton = page.getByRole('button', { name: 'Back to Login' });
  }

  public async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  public async expectPageLoaded(): Promise<void> {
    await expectAllVisible([this.firstNameInput, this.registerButton]);
  }

  public async expectFormFieldsVisible(): Promise<void> {
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.userNameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  public async expectRecaptchaVisible(): Promise<void> {
    await expect(this.recaptchaFrame).toBeVisible();
  }

  public async expectActionButtonsVisible(): Promise<void> {
    await expect(this.registerButton).toBeVisible();
    await expect(this.backToLoginButton).toBeVisible();
  }

  public async fillRegistrationForm(
    firstName: string,
    lastName: string,
    username: string,
    password: string,
  ): Promise<void> {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.userNameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  public async clickRegister(): Promise<void> {
    await this.registerButton.click();
  }

  public async clickBackToLogin(): Promise<void> {
    await this.backToLoginButton.click();
  }
}
