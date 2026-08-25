export interface TestConfig {
  baseURL: string;
  userPrefix: string;
}

function fromEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export function loadTestConfig(): TestConfig {
  return {
    baseURL: fromEnv('BASE_URL', 'https://demoqa.com'),
    userPrefix: fromEnv('TEST_USER_PREFIX', 'dqa'),
  };
}
