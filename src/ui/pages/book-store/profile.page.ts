import { Locator, Page, expect } from '@playwright/test';
import { LoadablePage } from '@ui/pages/loadable-page';
import { expectAllVisible } from '@ui/support/page-assertions';
import { DeleteConfirmationModal } from '@ui/components/delete-confirmation.modal';

export class ProfilePage implements LoadablePage {
  private readonly page: Page;
  private readonly usernameValue: Locator;
  private readonly searchBox: Locator;
  private readonly collectionTable: Locator;
  private readonly collectionRows: Locator;
  private readonly logoutButton: Locator;
  private readonly goToBookStoreButton: Locator;
  private readonly deleteAccountButton: Locator;
  private readonly deleteAllBooksButton: Locator;
  private readonly unauthBanner: Locator;
  public readonly deleteModal: DeleteConfirmationModal;

  constructor(page: Page) {
    this.page = page;
    this.usernameValue = page.locator('#userName-value');
    this.searchBox = page.getByPlaceholder('Type to search');
    this.collectionTable = page.getByRole('table').first();
    this.collectionRows = this.collectionTable
      .locator('tbody tr')
      .filter({ has: page.locator('span[id^="see-book-"]') });
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.goToBookStoreButton = page.getByRole('button', { name: 'Go To Book Store' });
    this.deleteAccountButton = page.getByRole('button', { name: 'Delete Account' });
    this.deleteAllBooksButton = page.getByRole('button', { name: 'Delete All Books' });
    this.unauthBanner = page.locator('#notLoggin-wrapper');
    this.deleteModal = new DeleteConfirmationModal(page);
  }

  public async goto(): Promise<void> {
    await this.page.goto('/profile');
  }

  public async expectPageLoaded(): Promise<void> {
    await expectAllVisible([this.collectionTable.or(this.unauthBanner)]);
  }

  public async expectAuthenticatedView(): Promise<void> {
    await expect(this.logoutButton).toBeVisible();
    await expect(this.goToBookStoreButton).toBeVisible();
    await expect(this.deleteAccountButton).toBeVisible();
    await expect(this.deleteAllBooksButton).toBeVisible();
  }

  public async expectUsername(username: string): Promise<void> {
    await expect(this.usernameValue).toHaveText(username);
  }

  public async expectRowCount(count: number): Promise<void> {
    await expect(this.collectionRows).toHaveCount(count);
  }

  public async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  public async clickGoToBookStore(): Promise<void> {
    await this.goToBookStoreButton.click();
  }

  public async clickDeleteAllBooks(): Promise<void> {
    await this.deleteAllBooksButton.click();
  }

  public async clickDeleteRow(isbn: string): Promise<void> {
    await this.page.locator(`#delete-record-${isbn}`).click();
  }

  public async clickSeeBookLink(title: string): Promise<void> {
    await this.page.locator(`span[id="see-book-${title}"]`).getByRole('link').click();
  }

  public async searchCollection(query: string): Promise<void> {
    await this.searchBox.fill(query);
  }

  public async clearSearch(): Promise<void> {
    await this.searchBox.fill('');
  }

  public async expectUnauthBannerVisible(): Promise<void> {
    await expect(this.unauthBanner).toBeVisible();
    await expect(this.unauthBanner).toContainText(
      'Currently you are not logged into the Book Store application',
    );
  }

  public async expectUnauthBannerHasAuthLinks(): Promise<void> {
    await expect(this.unauthBanner.getByRole('link', { name: 'login' })).toBeVisible();
    await expect(this.unauthBanner.getByRole('link', { name: 'register' })).toBeVisible();
  }
}
