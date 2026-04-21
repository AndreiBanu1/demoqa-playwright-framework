import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';

export class LoginPage extends BasePage {
  private readonly userNameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly newUserButton: Locator;
  private readonly invalidCredsError: Locator;

  constructor(page: Page) {
    super(page);
    this.userNameInput = page.getByPlaceholder('UserName');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.newUserButton = page.getByRole('button', { name: 'New User' });
    this.invalidCredsError = page.getByText('Invalid username or password!');
  }

  public async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  public async expectPageLoaded(): Promise<void> {
    await this.expectContentLoaded();
    await expect(this.userNameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  public async fillUsername(username: string): Promise<void> {
    await this.userNameInput.fill(username);
  }

  public async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  public async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  public async clickNewUser(): Promise<void> {
    await this.newUserButton.click();
  }

  public async submitCredentials(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickLogin();
  }

  public async expectInvalidCredentialsError(): Promise<void> {
    await expect(this.invalidCredsError).toBeVisible();
  }

  public async expectNoInvalidCredentialsError(): Promise<void> {
    await expect(this.invalidCredsError).toHaveCount(0);
  }
}
