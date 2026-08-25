import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus, assertStatusAndSchema } from '@api/support/api-assertions';
import { TestDataGenerator } from '@common/support/data-generator';
import addBooksSchema from '@api/schemas/book-store/add-books.schema.json';

const SAMPLE_ISBN = '9781449325862';

test.describe('Book Collection API', () => {
  let userId = '';
  let token = '';

  test.beforeAll(async ({ accountService }) => {
    const { username, password } = TestDataGenerator.generateUserCredentials();
    const createResp = await accountService.createUser(username, password);
    userId = createResp.body.userID;

    const tokenResp = await accountService.generateToken(username, password);
    token = tokenResp.body.token as string;
  });

  test.afterAll(async ({ accountService }) => {
    if (userId && token) {
      await accountService.deleteUser(userId, token);
    }
  });

  test('Should add a book to the authenticated user collection', async ({ bookStoreService }) => {
    const response = await test.step('Act — POST /BookStore/v1/Books with valid token', () =>
      bookStoreService.addBooks({ userId, collectionOfIsbns: [{ isbn: SAMPLE_ISBN }] }, token));

    await test.step('Assert — status 201 and schema valid', () => {
      assertStatusAndSchema(response, 201, addBooksSchema);
    });

    await test.step('Assert — response lists the added ISBN', () => {
      expect(response.body.books.map((book) => book.isbn)).toContain(SAMPLE_ISBN);
    });

    await test.step('Cleanup — remove all books from collection', async () => {
      await bookStoreService.deleteAllBooks(userId, token);
    });
  });

  test('Should return 401 when adding books without authentication', async ({
    bookStoreService,
  }) => {
    const response = await test.step('Act — POST /BookStore/v1/Books with no token', () =>
      bookStoreService.addBooks({ userId, collectionOfIsbns: [{ isbn: SAMPLE_ISBN }] }, ''));

    await test.step('Assert — status 401', () => {
      assertStatus(response, 401);
    });
  });

  test('Should delete all books from the user collection', async ({ bookStoreService }) => {
    await test.step('Arrange — add a book first', async () => {
      await bookStoreService.addBooks(
        { userId, collectionOfIsbns: [{ isbn: SAMPLE_ISBN }] },
        token,
      );
    });

    const response = await test.step('Act — DELETE /BookStore/v1/Books?UserId={userId}', () =>
      bookStoreService.deleteAllBooks(userId, token));

    await test.step('Assert — status 204', () => {
      assertStatus(response, 204);
    });
  });

  test('Should delete a specific book from the user collection', async ({ bookStoreService }) => {
    await test.step('Arrange — add a book first', async () => {
      await bookStoreService.addBooks(
        { userId, collectionOfIsbns: [{ isbn: SAMPLE_ISBN }] },
        token,
      );
    });

    const response = await test.step('Act — DELETE /BookStore/v1/Book', () =>
      bookStoreService.deleteBook({ isbn: SAMPLE_ISBN, userId }, token));

    await test.step('Assert — status 204', () => {
      assertStatus(response, 204);
    });
  });
});
