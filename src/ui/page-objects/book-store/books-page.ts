import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';

export class BooksPage extends BasePage {
  private readonly searchBox: Locator;
  private readonly loginButton: Locator;
  private readonly booksTable: Locator;
  private readonly tableHeader: Locator;
  private readonly tableRows: Locator;
  private readonly previousButton: Locator;
  private readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchBox = page.getByPlaceholder('Type to search');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.booksTable = page.getByRole('table').first();
    this.tableHeader = this.booksTable.locator('thead');
    this.tableRows = this.booksTable
      .locator('tbody tr')
      .filter({ has: page.locator('a') });
    this.previousButton = page.getByRole('button', { name: 'Previous' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
  }

  public async goto(): Promise<void> {
    await this.page.goto('/books');
  }

  public async expectPageLoaded(): Promise<void> {
    await this.expectContentLoaded();
    await expect(this.searchBox).toBeVisible();
    await expect(this.booksTable).toBeVisible();
  }

  public async searchBooks(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  public async clearSearch(): Promise<void> {
    await this.searchBox.fill('');
  }

  public async clickBookTitle(title: string): Promise<void> {
    await this.page.getByRole('link', { name: title, exact: true }).click();
  }

  public async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  public async clickPrevious(): Promise<void> {
    await this.previousButton.click();
  }

  public async expectColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(
        this.tableHeader.getByRole('columnheader', { name: header }),
      ).toBeVisible();
    }
  }

  public async expectRowCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }

  public async expectRowCountAtLeast(count: number): Promise<void> {
    await expect(async () => {
      expect(await this.tableRows.count()).toBeGreaterThanOrEqual(count);
    }).toPass();
  }

  public async getVisibleTitles(): Promise<string[]> {
    const rows = await this.tableRows.all();
    const titles: string[] = [];
    for (const row of rows) {
      const link = row.locator('a').first();
      const text = (await link.textContent()) ?? '';
      titles.push(text.trim());
    }
    return titles;
  }

  public async expectAllTitlesContain(substring: string): Promise<void> {
    const titles = await this.getVisibleTitles();
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      expect(title.toLowerCase()).toContain(substring.toLowerCase());
    }
  }

  public async expectEmptyResults(): Promise<void> {
    await expect(this.tableRows).toHaveCount(0);
  }

  public async expectLoginButtonVisible(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  public async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  public async expectPaginationControlsVisible(): Promise<void> {
    await expect(this.previousButton).toBeVisible();
    await expect(this.nextButton).toBeVisible();
  }
}
