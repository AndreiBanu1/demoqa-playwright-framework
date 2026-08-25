export interface TestConfig {
  baseURL: string;
  userPrefix: string;
}

export function loadTestConfig(): TestConfig {
  return {
    baseURL: process.env.BASE_URL ?? 'https://demoqa.com',
    userPrefix: process.env.TEST_USER_PREFIX ?? 'dqa',
  };
}
