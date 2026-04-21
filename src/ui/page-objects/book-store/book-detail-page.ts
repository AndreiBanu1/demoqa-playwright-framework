import { Locator, Page, expect } from '@playwright/test';
import { BasePage } from '../base-page';

export class BookDetailPage extends BasePage {
  private readonly isbnValue: Locator;
  private readonly titleValue: Locator;
  private readonly subtitleValue: Locator;
  private readonly authorValue: Locator;
  private readonly publisherValue: Locator;
  private readonly pagesValue: Locator;
  private readonly descriptionValue: Locator;
  private readonly websiteValue: Locator;
  private readonly backButton: Locator;
  private readonly addButton: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.isbnValue = page.locator('#ISBN-wrapper label').last();
    this.titleValue = page.locator('#title-wrapper label').last();
    this.subtitleValue = page.locator('#subtitle-wrapper label').last();
    this.authorValue = page.locator('#author-wrapper label').last();
    this.publisherValue = page.locator('#publisher-wrapper label').last();
    this.pagesValue = page.locator('#pages-wrapper label').last();
    this.descriptionValue = page.locator('#description-wrapper label').last();
    this.websiteValue = page.locator('#website-wrapper label').last();
    this.backButton = page.getByRole('button', { name: 'Back To Book Store' });
    this.addButton = page.getByRole('button', { name: 'Add To Your Collection' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  public async goto(isbn: string): Promise<void> {
    await this.page.goto(`/books?search=${encodeURIComponent(isbn)}`);
  }

  public async expectPageLoaded(): Promise<void> {
    await this.expectContentLoaded();
    await expect(this.isbnValue).toBeVisible();
    await expect(this.backButton).toBeVisible();
  }

  public async clickBack(): Promise<void> {
    await this.backButton.click();
  }

  public async clickAddToCollection(): Promise<void> {
    await this.addButton.click();
  }

  public async expectIsbn(isbn: string): Promise<void> {
    await expect(this.isbnValue).toHaveText(isbn);
  }

  public async expectTitle(title: string): Promise<void> {
    await expect(this.titleValue).toHaveText(title);
  }

  public async expectSubtitle(subtitle: string): Promise<void> {
    await expect(this.subtitleValue).toHaveText(subtitle);
  }

  public async expectAuthor(author: string): Promise<void> {
    await expect(this.authorValue).toHaveText(author);
  }

  public async expectPublisher(publisher: string): Promise<void> {
    await expect(this.publisherValue).toHaveText(publisher);
  }

  public async expectPages(pages: string): Promise<void> {
    await expect(this.pagesValue).toHaveText(pages);
  }

  public async expectDescriptionStartsWith(prefix: string): Promise<void> {
    await expect(this.descriptionValue).toContainText(prefix);
  }

  public async expectWebsite(website: string): Promise<void> {
    await expect(this.websiteValue).toHaveText(website);
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
