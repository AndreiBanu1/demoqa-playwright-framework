# Test suite profile

Probed: 2026-08-25 · Runner: @playwright/test ^1.59.1 · Language: ts (commonjs, strict)

## Groups

| Group   | Specs live in                    | `test` comes from                                                | Count              |
| ------- | -------------------------------- | ---------------------------------------------------------------- | ------------------ |
| browser | `src/tests/ui/**/*.ui.spec.ts`   | `import test, { expect } from '@common/fixtures/ui.fixtures';`   | 7 files / 35 tests |
| request | `src/tests/api/**/*.api.spec.ts` | `import { test, expect } from '@common/fixtures/base.fixtures';` | 7 files / 18 tests |

Note the asymmetry: `ui.fixtures` exports `test` as **default** (`export default test`), `base.fixtures`
exports it **named**. The two import lines are not interchangeable. No `component` or `database` group.
Accessibility specs are not a separate group — they are browser specs under `src/tests/ui/a11y/`,
tagged `@a11y`, and run as part of the `ui` project.

## Layers

- Page objects: `src/ui/pages/**/*.page.ts` (+ components `src/ui/components/*.modal.ts`) — base class:
  none; contract is the `LoadablePage` interface (`src/ui/pages/loadable-page.ts`), required member:
  `expectPageLoaded(): Promise<void>`. Every page also hand-rolls its own `goto()` (not in the interface).
- API clients: `src/api/services/*.service.ts` over `src/common/support/http-client.ts`; endpoint paths
  live in a private `ENDPOINTS` const per service. Assertion helpers: `src/api/support/api-assertions.ts`
  (`assertStatus`, `assertStatusAndSchema` — AJV + ajv-formats, `src/api/schemas/**/*.schema.json`).
- Fixtures: `src/common/fixtures/base.fixtures.ts` + `src/common/fixtures/ui.fixtures.ts` — two files that
  **compose** (ui extends base). Worker-scoped: `testConfig`, `workerUser`, `workerAuthState`.
  Test-scoped: `httpClient`, `accountService`, `bookStoreService`, `freshUser`, page objects.
  Auto fixtures (ui only): `blockAds`, `networkHandler`, `resetCollection`.
  Auth is an option, not a login flow: `test.use({ authenticated: true })` swaps `storageState` for
  cookies built from `workerUser`. `freshUser` exists because demoqa's GenerateToken invalidates the
  previous token, so a UI login as `workerUser` would break its worker-mates.
- Data sources: env vars only (`BASE_URL`, `TEST_USER_PREFIX`, `LOG_WORKER_USERS`, `CI`) read via
  `src/common/config/test-config.ts`; users generated at runtime by `TestDataGenerator`
  (`src/common/support/data-generator.ts`); no `.env`, no fixture/data JSON, no factories. Domain
  constants (anchor ISBNs, error codes/messages) are `const` literals at the top of each spec.
- Naming: files kebab-case + role suffix (`*.ui.spec.ts`, `*.api.spec.ts`, `*.page.ts`, `*.modal.ts`,
  `*.service.ts`, `*.schema.json`) · classes PascalCase · locators `private readonly` fields assigned in
  the constructor · methods `goto` / `fill*` / `click*` / `expect*` (page objects), `assert*` (api support)
  · every test title starts with `Should …` · `test.step` used heavily, API specs label steps
  `Act — …` / `Assert — …` / `Arrange — …` / `Cleanup — …`.

## Locator habit

Observed: role 21 · placeholder 8 · text 2 · label 0 · test-id 0 · CSS 17 · XPath 0
testIdAttribute: not configured (Playwright default `data-testid`) — and unused; the app has no test ids.
Effective priority: `getByRole` → `getByPlaceholder` → `getByText` → CSS (`#id` / `span[id^="see-book-"]` /
`.modal-*`) as the escape hatch for demoqa's unlabelled widgets. All 17 CSS locators are inside
`src/ui/**` — zero raw locators in spec files.

## Commands

| Purpose      | Command                                                     |
| ------------ | ----------------------------------------------------------- |
| install      | `npm ci && npx playwright install --with-deps chromium`     |
| lint         | `npm run lint`                                              |
| typecheck    | `npm run typecheck`                                         |
| format check | `npm run format:check`                                      |
| all gates    | `npm run verify` (typecheck + lint + format + check:specs)  |
| list         | `npx playwright test --list`                                |
| run one      | `npx playwright test src/tests/ui/account/login.ui.spec.ts` |
| run group    | `npm run test:ui` · `npm run test:api`                      |
| run tag      | `npm run test:smoke` · `npm run test:a11y`                  |
| run all      | `npm test`                                                  |

## Run targets

Two literal projects in `playwright.config.ts`: `api` (testDir `./src/tests/api`, testMatch
`/.*\.api\.spec\.ts$/`) and `ui` (testDir `./src/tests/ui`, testMatch `/.*\.ui\.spec\.ts$/`,
`devices['Desktop Chrome']`). Not generated. Both hit the live public site at `baseURL`.

## Enforced prohibitions

- `eslint-plugin-playwright` flat/recommended on `src/**/*.spec.ts` — bans `page.$`/`$$`, conditionals in
  tests, `waitForTimeout`, focused/skipped-without-reason tests, etc.
- `playwright/expect-expect` is narrowed: an assertion only counts if the call matches `^expect`,
  `^assert`, or exactly `scan` (`eslint.config.mjs`). A new assertion helper named otherwise fails lint.
- `typescript-eslint` **recommendedTypeChecked** on all of `src` — no unchecked `any`, unsafe member
  access, or floating promises; `tsc` adds `strict`, `noUnusedLocals`, `noUnusedParameters`,
  `noImplicitOverride`.
- `npm run check:specs` (`scripts/check-spec-placement.mjs`, also a CI step) — a spec under
  `src/tests/{api,ui}` must carry the matching suffix, and no spec may live outside those two trees.
  Otherwise no project claims it and Playwright skips it silently with exit 0.
- Imports use the `@api/*` / `@ui/*` / `@common/*` aliases, never relative paths, across all of `src`.
- Prettier is authoritative on formatting; CI fails on `format:check`.

## Frictions

- **The README documents an import line that does not compile.** README §Path aliases shows
  `import { test, expect } from '@common/fixtures/ui.fixtures';`, but that module has no named `test`
  export. Copying the documented line produces a broken spec; use the verbatim line in Groups above.
- Two entry points with two different import shapes (default vs named) is a standing trap for generated
  specs and for anyone moving a spec between the `ui` and `api` trees.
- `workers: 4` is hardcoded in the config, so CI ignores its own core count while three shards run
  concurrently against the shared public demoqa.com. Load, not local concurrency, is the flake source.
- `src/tests/ui/a11y/accessibility.ui.spec.ts` allow-lists four axe rules (`image-alt`, `link-name`,
  `button-name`, `color-contrast`) as `KNOWN_VIOLATIONS`. It only catches regressions; the list is a
  permanent baseline with no expiry or ticket reference.
- `TestDataGenerator.generateWeakPassword()` is dead code — specs inline the weak password instead.
  A shared `DEFAULT_PASSWORD` constant is used for every provisioned account.
- Page objects satisfy `LoadablePage` but `goto()` is outside the contract, so nothing forces a new page
  object to expose navigation the way the existing five do.

## Unknown

- Component and database testing: no evidence either exists or is wanted; ask before adding a group.
- Mocking/interception policy beyond ad-blocking (`blockAds`) and the assert-no-request helper
  (`expectNoRequest`): the suite never stubs application responses, but nothing states that as a rule.
- Whether `BASE_URL` is ever pointed at a non-demoqa deployment (the CI secret implies it might be).
