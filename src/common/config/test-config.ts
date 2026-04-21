export interface TestConfig {
  baseURL: string;
  username: string;
  password: string;
  userId: string;
}

export function loadTestConfig(): TestConfig {
  return {
    baseURL: process.env.BASE_URL ?? 'https://demoqa.com',
    username: process.env.TEST_USERNAME ?? 'admin',
    password: process.env.TEST_PASSWORD ?? 'Password123@',
    userId: process.env.TEST_USER_ID ?? 'af920241-b8be-4048-b260-ce7486fb09e7',
  };
}
