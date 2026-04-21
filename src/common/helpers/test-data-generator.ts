import { randomUUID } from 'node:crypto';

export class TestDataGenerator {
  private static readonly DEFAULT_PASSWORD = 'TestPass@1234!';

  public static generateUsername(): string {
    return `dqa_${randomUUID().replace(/-/g, '').slice(0, 10)}`;
  }

  public static generateUserCredentials(): { username: string; password: string } {
    return {
      username: TestDataGenerator.generateUsername(),
      password: TestDataGenerator.DEFAULT_PASSWORD,
    };
  }
}
