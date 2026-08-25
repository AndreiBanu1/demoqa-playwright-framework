import { randomUUID } from 'node:crypto';

export interface GeneratedCredentials {
  username: string;
  password: string;
}

export class TestDataGenerator {
  public static readonly DEFAULT_PASSWORD = 'TestPass@1234!';

  public static generateUsername(prefix = 'dqa'): string {
    return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
  }

  public static generateUserCredentials(prefix?: string): GeneratedCredentials {
    return {
      username: TestDataGenerator.generateUsername(prefix),
      password: TestDataGenerator.DEFAULT_PASSWORD,
    };
  }

  public static generateWeakPassword(): string {
    return 'weakpass';
  }
}
