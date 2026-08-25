import { Locator, Page, expect } from '@playwright/test';
import { LoadablePage } from '@ui/pages/loadable-page';
import { expectAllVisible } from '@ui/support/page-assertions';

export class BooksPage implements LoadablePage {
  private readonly page: Page;
  private readonly searchBox: Locator;
  private readonly loginButton: Locator;
  private readonly booksTable: Locator;
  private readonly tableHeader: Locator;
  private readonly tableRows: Locator;
  private readonly titleLinks: Locator;
  private readonly previousButton: Locator;
  private readonly nextButton: Locator;
  private readonly pageIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchBox = page.locator('div.ReactTable input#searchBox');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.booksTable = page.locator('div.ReactTable div.rt-table');
    this.tableHeader = this.booksTable.locator('div.rt-thead');
    this.tableRows = this.booksTable
      .locator('div.rt-tbody div.rt-tr-group')
      .filter({ has: page.locator('a') });
    this.titleLinks = this.tableRows.locator('div.rt-td:nth-child(2) a');
    this.previousButton = page.locator('div.-previous > button');
    this.nextButton = page.locator('div.-next > button');
    this.pageIndicator = page.locator('span.-pageInfo');
  }

  public async goto(): Promise<void> {
    await this.page.goto('/books');
  }

  public async expectPageLoaded(): Promise<void> {
    await expectAllVisible([this.searchBox, this.booksTable]);
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

  public async expectColumnHeaders(headers: string[]): Promise<void> {
    for (const header of headers) {
      await expect(this.tableHeader.getByRole('columnheader', { name: header })).toBeVisible();
    }
  }

  public async expectRowCount(count: number): Promise<void> {
    await expect(this.tableRows).toHaveCount(count);
  }

  public async getVisibleTitles(): Promise<string[]> {
    return (await this.titleLinks.allTextContents()).map((text) => text.trim());
  }

  /** Asserts the rendered titles are exactly `expected`, in order. */
  public async expectTitles(expected: string[]): Promise<void> {
    await expect(this.titleLinks).toHaveText(expected.map((title) => title.trim()));
  }

  public async expectAllTitlesContain(substring: string): Promise<void> {
    const needle = substring.toLowerCase();
    await expect(async () => {
      const titles = await this.getVisibleTitles();
      expect(titles.length, `no rows matched "${substring}"`).toBeGreaterThan(0);
      for (const title of titles) {
        expect(title.toLowerCase()).toContain(needle);
      }
    }).toPass();
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

  public async expectPaginationState(expected: {
    previousEnabled: boolean;
    nextEnabled: boolean;
    currentPage: number;
    totalPages: number;
  }): Promise<void> {
    await expect(this.previousButton).toBeVisible();
    await expect(this.nextButton).toBeVisible();
    await expect(this.previousButton).toBeEnabled({ enabled: expected.previousEnabled });
    await expect(this.nextButton).toBeEnabled({ enabled: expected.nextEnabled });
    await expect(this.pageIndicator).toHaveText(
      `Page ${expected.currentPage} of ${expected.totalPages}`,
    );
  }
}
