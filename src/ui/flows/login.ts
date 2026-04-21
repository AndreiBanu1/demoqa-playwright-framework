import { Page, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/account/login-page';
import { AccountService } from '../../api/services/accountService';
import { TestConfig } from '../../common/config/test-config';

export class LoginFlow {
  constructor(
    private readonly page: Page,
    private readonly loginPage: LoginPage,
    private readonly accountService: AccountService,
    private readonly testConfig: TestConfig,
  ) {}

  public async loginViaUi(username: string, password: string): Promise<string> {
    const tokenResponsePromise = this.page.waitForResponse(
      (r) => r.url().includes('/Account/v1/GenerateToken') && r.request().method() === 'POST',
    );

    await this.loginPage.goto();
    await this.loginPage.expectPageLoaded();
    await this.loginPage.submitCredentials(username, password);

    const tokenResponse = await tokenResponsePromise;
    expect(tokenResponse.status(), 'GenerateToken failed during UI login').toBe(200);
    const body = (await tokenResponse.json()) as { token: string | null; status: string };
    expect(body.status).toBe('Success');
    expect(body.token, 'UI login produced null token').not.toBeNull();

    await this.page.waitForURL('**/profile');
    return body.token as string;
  }

  public async loginAsAdminViaUi(): Promise<string> {
    return this.loginViaUi(this.testConfig.username, this.testConfig.password);
  }

  public async generateToken(username: string, password: string): Promise<string> {
    const response = await this.accountService.generateToken(username, password);
    expect(response.status, 'Token generation failed').toBe(200);
    expect(response.body.token, 'Token response missing token').not.toBeNull();
    return response.body.token as string;
  }

  public async getAdminToken(): Promise<string> {
    return this.generateToken(this.testConfig.username, this.testConfig.password);
  }
}
