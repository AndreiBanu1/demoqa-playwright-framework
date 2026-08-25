import { HttpClient, ApiResponse } from '@common/support/http-client';
import { Book } from '@api/types/book';

export type { Book };

export interface BooksResponse {
  books: Book[];
}

export interface AddBooksInput {
  userId: string;
  collectionOfIsbns: Array<{ isbn: string }>;
}

export interface AddBooksResponse {
  books: Array<{ isbn: string }>;
}

export interface DeleteBookInput {
  isbn: string;
  userId: string;
}

export class BookStoreService {
  private readonly ENDPOINTS = {
    GET_BOOKS: '/BookStore/v1/Books',
    GET_BOOK: (isbn: string) => `/BookStore/v1/Book?ISBN=${encodeURIComponent(isbn)}`,
    ADD_BOOKS: '/BookStore/v1/Books',
    DELETE_BOOK: '/BookStore/v1/Book',
    DELETE_USER_BOOKS: (userId: string) =>
      `/BookStore/v1/Books?UserId=${encodeURIComponent(userId)}`,
  } as const;

  constructor(private readonly httpClient: HttpClient) {}

  public getBooks(): Promise<ApiResponse<BooksResponse>> {
    return this.httpClient.get<BooksResponse>(this.ENDPOINTS.GET_BOOKS);
  }

  public getBook(isbn: string): Promise<ApiResponse<Book>> {
    return this.httpClient.get<Book>(this.ENDPOINTS.GET_BOOK(isbn));
  }

  public addBooks(input: AddBooksInput, token: string): Promise<ApiResponse<AddBooksResponse>> {
    return this.httpClient.post<AddBooksResponse>(this.ENDPOINTS.ADD_BOOKS, { body: input, token });
  }

  public deleteBook(input: DeleteBookInput, token: string): Promise<ApiResponse<unknown>> {
    return this.httpClient.delete(this.ENDPOINTS.DELETE_BOOK, { body: input, token });
  }

  public deleteAllBooks(userId: string, token: string): Promise<ApiResponse<unknown>> {
    return this.httpClient.delete(this.ENDPOINTS.DELETE_USER_BOOKS(userId), { token });
  }
}
