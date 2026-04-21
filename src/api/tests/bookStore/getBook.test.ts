import { test, expect } from '../../../common/fixtures/fixtures';
import { assertRestResponseAndSchema, assertRestResponse } from '../../../common/helpers/api-assertions';

const GET_BOOK_SCHEMA = 'src/api/tests/bookStore/schema/getBook.schema.json';
const KNOWN_ISBN = '9781449325862';
const KNOWN_TITLE = 'Git Pocket Guide';

test.describe('Get Book API', () => {
  test('Should return a single book by valid ISBN', async ({ bookStoreService }) => {
    await test.step('Act — GET /BookStore/v1/Book?ISBN={isbn}', async () => {
      const response = await bookStoreService.getBook(KNOWN_ISBN);

      await test.step('Assert — status 200 and schema valid', async () => {
        await assertRestResponseAndSchema(response, GET_BOOK_SCHEMA, 200);
      });

      await test.step('Assert — returned book matches the requested ISBN', async () => {
        expect(response.body.isbn).toBe(KNOWN_ISBN);
        expect(response.body.title).toBe(KNOWN_TITLE);
      });
    });
  });

  test('Should return 400 for an ISBN not in the catalogue', async ({ bookStoreService }) => {
    await test.step('Act — GET /BookStore/v1/Book?ISBN=invalid', async () => {
      const response = await bookStoreService.getBook('0000000000000');

      await test.step('Assert — status 400', async () => {
        assertRestResponse(response, 400);
      });
    });
  });
});
