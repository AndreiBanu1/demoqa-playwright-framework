import { Locator, Page, expect } from '@playwright/test';
import { LoadablePage } from '@ui/pages/loadable-page';
import { expectAllVisible } from '@ui/support/page-assertions';

export class LoginPage implements LoadablePage {
  private readonly page: Page;
  private readonly userNameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly newUserButton: Locator;
  private readonly invalidCredsError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.userNameInput = page.locator('#userForm > div:nth-child(1) input.form-control');
    this.passwordInput = page.locator('#userForm > div:nth-child(2) input.form-control');
    this.loginButton = page.locator('#userForm > div:nth-child(3) button.btn-primary').first();
    this.newUserButton = page.locator('#userForm > div:nth-child(3) button.btn-primary').last();
    this.invalidCredsError = page.getByText('Invalid username or password!');
  }

  public async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  public async expectPageLoaded(): Promise<void> {
    await expectAllVisible([this.userNameInput, this.passwordInput, this.loginButton]);
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
}
