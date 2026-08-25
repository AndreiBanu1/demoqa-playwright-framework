import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'blob-report/',
      'playwright/.cache/',
      'playwright/.auth/',
      'dist/',
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    files: ['**/*.mjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },

  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { console: 'readonly', process: 'readonly' },
    },
  },

  {
    files: ['src/**/*.ts', 'playwright.config.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  {
    files: ['src/common/fixtures/**/*.ts'],
    rules: {
      'no-empty-pattern': 'off',
    },
  },

  {
    files: ['src/**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      'playwright/expect-expect': [
        'error',
        {
          assertFunctionNames: ['expect'],
          assertFunctionPatterns: [
            '^expect', // page-object/component assertions + expectNoRequest()
            '^assert', // API layer: assertStatus(), assertStatusAndSchema()
            '^scan$', // the a11y spec's local axe wrapper
          ],
        },
      ],
    },
  },

  prettier,
);
