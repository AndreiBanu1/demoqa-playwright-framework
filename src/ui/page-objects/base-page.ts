import { Locator, Page, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly loadingSpinner: Locator;

  protected constructor(page: Page) {
    this.page = page;
    this.loadingSpinner = page.locator('.spinner-border, #loader').first();
  }

  public abstract expectPageLoaded(): Promise<void>;

  public async expectContentLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    if (await this.loadingSpinner.count()) {
      await expect(this.loadingSpinner).toBeHidden();
    }
  }

  public async reloadPage(): Promise<void> {
    await this.page.reload();
  }

  public getCurrentUrl(): string {
    return this.page.url();
  }
}
