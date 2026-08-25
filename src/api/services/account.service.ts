import { HttpClient, ApiResponse } from '@common/support/http-client';
import { Book } from '@api/types/book';
import { ApiErrorResponse } from '@api/types/api-error';

export interface CreateUserResponse {
  userID: string;
  username: string;
  books: Book[];
}

export interface GenerateTokenResponse {
  token: string | null;
  expires: string | null;
  status: string;
  result: string;
}

export interface GetUserResponse {
  userId: string;
  username: string;
  books: Book[];
}

export interface UserCredentials {
  userName: string;
  password: string;
}

export type AuthorizedResponse = boolean | ApiErrorResponse;

export class AccountService {
  private readonly ENDPOINTS = {
    CREATE_USER: '/Account/v1/User',
    GENERATE_TOKEN: '/Account/v1/GenerateToken',
    AUTHORIZED: '/Account/v1/Authorized',
    GET_USER: (userId: string) => `/Account/v1/User/${encodeURIComponent(userId)}`,
    DELETE_USER: (userId: string) => `/Account/v1/User/${encodeURIComponent(userId)}`,
  } as const;

  constructor(private readonly httpClient: HttpClient) {}

  public createUser(username: string, password: string): Promise<ApiResponse<CreateUserResponse>> {
    return this.httpClient.post<CreateUserResponse>(this.ENDPOINTS.CREATE_USER, {
      body: { userName: username, password },
    });
  }

  public generateToken(
    username: string,
    password: string,
  ): Promise<ApiResponse<GenerateTokenResponse>> {
    return this.httpClient.post<GenerateTokenResponse>(this.ENDPOINTS.GENERATE_TOKEN, {
      body: { userName: username, password },
    });
  }

  public isAuthorized(
    username: string,
    password: string,
  ): Promise<ApiResponse<AuthorizedResponse>> {
    return this.httpClient.post<AuthorizedResponse>(this.ENDPOINTS.AUTHORIZED, {
      body: { userName: username, password },
    });
  }

  public getUser(userId: string, token: string): Promise<ApiResponse<GetUserResponse>> {
    return this.httpClient.get<GetUserResponse>(this.ENDPOINTS.GET_USER(userId), { token });
  }

  public deleteUser(userId: string, token: string): Promise<ApiResponse<unknown>> {
    return this.httpClient.delete(this.ENDPOINTS.DELETE_USER(userId), { token });
  }
}
