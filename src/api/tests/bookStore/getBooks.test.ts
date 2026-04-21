import { test, expect } from '../../../common/fixtures/fixtures';
import { assertRestResponseAndSchema } from '../../../common/helpers/api-assertions';

const GET_BOOKS_SCHEMA = 'src/api/tests/bookStore/schema/getBooks.schema.json';

test.describe('Get Books API', () => {
  test('Should return the full books catalogue', async ({ bookStoreService }) => {
    await test.step('Act — GET /BookStore/v1/Books', async () => {
      const response = await bookStoreService.getBooks();

      await test.step('Assert — status 200 and schema valid', async () => {
        await assertRestResponseAndSchema(response, GET_BOOKS_SCHEMA, 200);
      });

      await test.step('Assert — catalogue contains at least one book', async () => {
        expect(response.body.books.length).toBeGreaterThan(0);
      });

      await test.step('Assert — each book has required fields', async () => {
        for (const book of response.body.books) {
          expect(book.isbn).toBeTruthy();
          expect(book.title).toBeTruthy();
          expect(book.author).toBeTruthy();
        }
      });
    });
  });
});
