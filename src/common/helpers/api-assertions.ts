import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { expect } from '@playwright/test';
import { ApiResponse } from './http-client';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export function assertRestResponse(response: ApiResponse<unknown>, expectedStatus: number): void {
  expect(
    response.status,
    `Expected HTTP ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.body)}`,
  ).toBe(expectedStatus);
}

export async function assertRestResponseAndSchema(
  response: ApiResponse<unknown>,
  schemaPath: string,
  expectedStatus: number,
): Promise<void> {
  assertRestResponse(response, expectedStatus);
  const schema = JSON.parse(fs.readFileSync(path.resolve(schemaPath), 'utf-8'));
  const validate = ajv.compile(schema);
  const ok = validate(response.body);
  expect(ok, `Schema validation failed: ${ajv.errorsText(validate.errors)}`).toBe(true);
}
