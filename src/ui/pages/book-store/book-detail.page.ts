import { Locator, Page, expect } from '@playwright/test';
import { LoadablePage } from '@ui/pages/loadable-page';
import { expectAllVisible } from '@ui/support/page-assertions';

export type BookDetailField =
  'isbn' | 'title' | 'subtitle' | 'author' | 'publisher' | 'pages' | 'description' | 'website';

export type FieldExpectation = string | { contains: string };

export type BookDetailExpectations = Partial<Record<BookDetailField, FieldExpectation>>;

const FIELD_WRAPPER_IDS: Record<BookDetailField, string> = {
  isbn: 'ISBN',
  title: 'title',
  subtitle: 'subtitle',
  author: 'author',
  publisher: 'publisher',
  pages: 'pages',
  description: 'description',
  website: 'website',
};

export class BookDetailPage implements LoadablePage {
  private readonly page: Page;
  private readonly fields: Record<BookDetailField, Locator>;
  private readonly backButton: Locator;
  private readonly addButton: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fields = Object.fromEntries(
      Object.entries(FIELD_WRAPPER_IDS).map(([field, wrapperId]) => [
        field,
        page.locator(`#${wrapperId}-wrapper label`).last(),
      ]),
    ) as Record<BookDetailField, Locator>;
    this.backButton = page.getByRole('button', { name: 'Back To Book Store' });
    this.addButton = page.getByRole('button', { name: 'Add To Your Collection' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  public async goto(isbn: string): Promise<void> {
    await this.page.goto(`/books?search=${encodeURIComponent(isbn)}`);
  }

  public async expectPageLoaded(): Promise<void> {
    await expectAllVisible([this.fields.isbn, this.backButton]);
  }

  public async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  public async clickAddToCollection(): Promise<void> {
    await this.addButton.click();
  }

  public async expectDetails(expected: BookDetailExpectations): Promise<void> {
    const entries = Object.entries(expected) as Array<[BookDetailField, FieldExpectation]>;
    expect(entries, 'expectDetails() was called with nothing to assert').not.toEqual([]);

    for (const [field, expectation] of entries) {
      const value = this.fields[field];
      if (typeof expectation === 'string') {
        await expect(value, `book detail field "${field}"`).toHaveText(expectation);
      } else {
        await expect(value, `book detail field "${field}"`).toContainText(expectation.contains);
      }
    }
  }

  public async expectAddButtonVisible(): Promise<void> {
    await expect(this.addButton).toBeVisible();
  }

  public async expectAddButtonHidden(): Promise<void> {
    await expect(this.addButton).toHaveCount(0);
  }

  public async expectLoginButtonVisible(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }
}
