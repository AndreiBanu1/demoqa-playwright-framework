import Ajv, { type SchemaObject, type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { expect } from '@playwright/test';
import { ApiResponse } from '@common/support/http-client';
import bookSchema from '@api/schemas/book-store/book.schema.json';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const SHARED_SCHEMAS: SchemaObject[] = [bookSchema];
for (const schema of SHARED_SCHEMAS) {
  ajv.addSchema(schema);
}

const validatorCache = new WeakMap<SchemaObject, ValidateFunction>();

function getValidator(schema: SchemaObject): ValidateFunction {
  const cached = validatorCache.get(schema);
  if (cached) {
    return cached;
  }
  const id = typeof schema.$id === 'string' ? schema.$id : undefined;
  const validate = (id ? ajv.getSchema(id) : undefined) ?? ajv.compile(schema);
  validatorCache.set(schema, validate);
  return validate;
}

export function assertStatus(response: ApiResponse<unknown>, expectedStatus: number): void {
  expect(
    response.status,
    `Expected HTTP ${expectedStatus}, got ${response.status}: ${JSON.stringify(response.body)}`,
  ).toBe(expectedStatus);
}

export function assertStatusAndSchema(
  response: ApiResponse<unknown>,
  expectedStatus: number,
  schema: SchemaObject,
): void {
  assertStatus(response, expectedStatus);
  const validate = getValidator(schema);
  const ok = validate(response.body);
  expect(ok, `Schema validation failed: ${ajv.errorsText(validate.errors)}`).toBe(true);
}
