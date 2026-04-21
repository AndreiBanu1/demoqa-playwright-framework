import { HttpClient, ApiResponse } from '../../common/helpers/http-client';

export interface CreateUserResponse {
  userID: string;
  username: string;
  books: unknown[];
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
  books: UserBook[];
}

export interface UserBook {
  isbn: string;
  title: string;
  subTitle: string;
  author: string;
  publish_date: string;
  publisher: string;
  pages: number;
  description: string;
  website: string;
}

export interface UserCredentials {
  userName: string;
  password: string;
}

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

  public generateToken(username: string, password: string): Promise<ApiResponse<GenerateTokenResponse>> {
    return this.httpClient.post<GenerateTokenResponse>(this.ENDPOINTS.GENERATE_TOKEN, {
      body: { userName: username, password },
    });
  }

  public isAuthorized(username: string, password: string): Promise<ApiResponse<boolean>> {
    return this.httpClient.post<boolean>(this.ENDPOINTS.AUTHORIZED, {
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
