import { Locator, Page, expect } from '@playwright/test';

export class DeleteConfirmationModal {
  private readonly container: Locator;
  private readonly title: Locator;
  private readonly body: Locator;
  private readonly okButton: Locator;
  private readonly cancelButton: Locator;

  constructor(page: Page) {
    this.container = page.locator('.modal-content');
    this.title = this.container.locator('.modal-title');
    this.body = this.container.locator('.modal-body');
    this.okButton = page.locator('#closeSmallModal-ok');
    this.cancelButton = page.locator('#closeSmallModal-cancel');
  }

  public async expectVisible(): Promise<void> {
    await expect(this.container).toBeVisible();
  }

  public async expectHidden(): Promise<void> {
    await expect(this.container).toBeHidden();
  }

  public async expectTitle(title: string): Promise<void> {
    await expect(this.title).toHaveText(title);
  }

  public async expectBodyContains(text: string): Promise<void> {
    await expect(this.body).toContainText(text);
  }

  public async clickOk(): Promise<void> {
    await this.okButton.click();
  }

  public async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
