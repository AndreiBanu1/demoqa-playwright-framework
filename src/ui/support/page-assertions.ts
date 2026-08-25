import { Locator, expect } from '@playwright/test';

export async function expectAllVisible(locators: Locator[]): Promise<void> {
  for (const locator of locators) {
    await expect(locator).toBeVisible();
  }
}
