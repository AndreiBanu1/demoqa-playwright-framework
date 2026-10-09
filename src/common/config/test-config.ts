import { baseLogger as log } from '../../observability/logger';

export interface TestConfig {
  baseURL: string;
  userPrefix: string;
}

function fromEnv(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value ? value : fallback;
}

export function loadTestConfig(): TestConfig {
  const config: TestConfig = {
    baseURL: fromEnv('BASE_URL', 'https://demoqa.com'),
    userPrefix: fromEnv('TEST_USER_PREFIX', 'dqa'),
  };
  log.info({ event: 'config_loaded', baseURL: config.baseURL, userPrefix: config.userPrefix });
  return config;
}
