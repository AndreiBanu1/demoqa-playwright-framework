import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatusAndSchema } from '@api/support/api-assertions';
import getBooksSchema from '@api/schemas/book-store/get-books.schema.json';

test.describe('Get Books API', () => {
  test(
    'Should return the full books catalogue',
    { tag: '@smoke' },
    async ({ bookStoreService }) => {
      const response = await test.step('Act — GET /BookStore/v1/Books', () =>
        bookStoreService.getBooks());

      await test.step('Assert — status 200 and schema valid', () => {
        assertStatusAndSchema(response, 200, getBooksSchema);
      });

      await test.step('Assert — catalogue contains books with unique ISBNs', () => {
        expect(response.body.books.length).toBeGreaterThan(0);
        const isbns = response.body.books.map((book) => book.isbn);
        expect(new Set(isbns).size).toBe(isbns.length);
      });
    },
  );
});
