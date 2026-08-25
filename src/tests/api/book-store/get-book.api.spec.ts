import { test, expect } from '@common/fixtures/base.fixtures';
import { assertStatus, assertStatusAndSchema } from '@api/support/api-assertions';
import getBookSchema from '@api/schemas/book-store/get-book.schema.json';

const KNOWN_ISBN = '9781449325862';
const KNOWN_TITLE = 'Git Pocket Guide';

test.describe('Get Book API', () => {
  test(
    'Should return a single book by valid ISBN',
    { tag: '@smoke' },
    async ({ bookStoreService }) => {
      const response = await test.step('Act — GET /BookStore/v1/Book?ISBN={isbn}', () =>
        bookStoreService.getBook(KNOWN_ISBN));

      await test.step('Assert — status 200 and schema valid', () => {
        assertStatusAndSchema(response, 200, getBookSchema);
      });

      await test.step('Assert — returned book matches the requested ISBN', () => {
        expect(response.body.isbn).toBe(KNOWN_ISBN);
        expect(response.body.title).toBe(KNOWN_TITLE);
      });
    },
  );

  test('Should return 400 for an ISBN not in the catalogue', async ({ bookStoreService }) => {
    const response = await test.step('Act — GET /BookStore/v1/Book?ISBN=0000000000000', () =>
      bookStoreService.getBook('0000000000000'));

    await test.step('Assert — status 400', () => {
      assertStatus(response, 400);
    });
  });
});
