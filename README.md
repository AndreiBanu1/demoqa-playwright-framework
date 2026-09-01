# DemoQA Playwright Framework

UI and API test automation for [demoqa.com](https://demoqa.com) — a public demo site whose Book Store
application (catalog, login/register, profile, collection management) is backed by a REST API. Both
layers are exercised from a single TypeScript codebase with shared configuration, fixtures and
assertion helpers.

For the full agnostic version of Claude skills, please checK: [playwright-suite-skills](https://github.com/AndreiBanu1/playwright-suite-skills)

## What's covered

**UI — `src/tests/ui/`**

- Book catalog: search, pagination footer state, row navigation
- Book detail: metadata rendering, add-to-collection, back navigation
- Login and Register
- Profile: collection listing, single and bulk delete, logout
- Accessibility scans on key pages (`@a11y`)

**API — `src/tests/api/`**

- `Account/v1/*` — user creation, token generation, authorization, user lookup, user deletion
- `BookStore/v1/*` — list books, get book by ISBN, add to collection, delete from collection
- Every response asserted against a JSON Schema in `src/api/schemas/`

## Stack

| Concern          | Choice                                                       |
| ---------------- | ------------------------------------------------------------ |
| Runner           | Playwright Test — `api` and `ui` projects, parallel          |
| UI architecture  | Page Object Model — no base class, a `LoadablePage` contract |
| API architecture | Thin `HttpClient` + one service class per API area           |
| Schema checks    | AJV + ajv-formats                                            |
| Accessibility    | `@axe-core/playwright`                                       |
| Lint / format    | ESLint flat config (type-checked) + Prettier                 |
| CI               | GitHub Actions, 3-way sharding, merged HTML report           |

## Quick start

```bash
npm install
npx playwright install chromium
```

No credentials to set up: the framework provisions every account it needs through the API and
deletes them again at teardown. Two optional variables tune it:

```bash
export BASE_URL=https://demoqa.com   # target environment (default: https://demoqa.com)
export TEST_USER_PREFIX=dqa          # prefix for the accounts the run creates for itself
```

Then:

```bash
npm test               # everything
npm run test:api       # API project only
npm run test:ui        # UI project only
npm run test:smoke     # @smoke tagged tests
npm run test:a11y      # @a11y tagged tests
npm run test:headed    # UI tests in a visible browser
npm run test:debug     # Playwright inspector
npm run report         # open the last HTML report

npm run verify         # typecheck + lint + format:check + check:specs (what CI gates on)
npm run check:specs    # fail if any spec sits where no project will run it
npm run lint:fix       # ESLint autofix
npm run format         # Prettier write
```

## Layout

Specs are separated from the code that supports them: `src/tests/` is what is covered, everything
beside it is how. Nothing outside `src/tests/` imports from it, so the dependency arrow only ever
points inward.

```
src/
├── tests/                  # every spec, and nothing else
│   ├── api/                # *.api.spec.ts → the `api` project
│   └── ui/                 # *.ui.spec.ts  → the `ui` project
│
├── api/                    # the API client
│   ├── services/           # AccountService, BookStoreService — one per API area
│   ├── schemas/            # JSON Schemas, mirrored by area (account/, book-store/)
│   ├── types/              # shared request/response types
│   └── support/            # api-assertions — status + schema assertions
│
├── ui/                     # the UI object model
│   ├── pages/              # loadable-page.ts contract + account/, book-store/ page objects
│   ├── components/         # reusable widgets (e.g. delete-confirmation.modal.ts)
│   └── support/            # page-assertions — shared visibility helpers
│
└── common/                 # cross-cutting only
    ├── config/             # test-config.ts — env-driven configuration
    ├── fixtures/           # base.fixtures.ts, ui.fixtures.ts
    └── support/            # http-client, network-handler, data-generator, request-assertions
```

Each Playwright project takes its own `testDir`, so the directory a spec lives in decides which
project runs it; the filename suffix documents that intent in editor tabs and stack traces.

The combination has one silent failure mode worth knowing about: if directory and suffix disagree,
no project claims the file and Playwright skips it without complaint — `--list` just reports one
file fewer and exits 0. `npm run check:specs` fails the build on that, and runs in `npm run verify`
and as its own CI step.

## Fixture architecture

Two layers, so API specs never pay for browser setup:

1. **`src/common/fixtures/base.fixtures.ts`** — extends `@playwright/test` with the API-side graph:
   `testConfig` → `httpClient` → `accountService` / `bookStoreService`, plus the account fixtures
   (`workerUser`, `workerAuthState`, `freshUser`). API specs import from here.
2. **`src/common/fixtures/ui.fixtures.ts`** — extends the base fixtures with browser-side objects:
   every page object, the reusable components, `networkHandler`, and the `authenticated` option that
   decides whether the browser context starts logged in. UI specs import from here.

Because layer 2 builds on layer 1, a UI spec can reach for `bookStoreService` to arrange state over
the API and then assert it in the browser — the fast path for setup and teardown.

`networkHandler` also route-blocks ad and tracker hosts and collects failed responses, which keeps
runs on this third-party demo site stable.

## Test data isolation and authentication

There is no shared account and no credential in the repository. Each Playwright worker provisions
its own user:

- **Arrange** — the worker-scoped `workerUser` fixture calls `POST /Account/v1/User` with credentials
  from `TestDataGenerator`, then `POST /Account/v1/GenerateToken`, and exposes
  `{ userId, username, password, token, expires }` to every test in that worker. It builds its own
  `APIRequestContext` because the built-in `request` fixture is test-scoped.
- **Act** — tests mutate only their own worker's collection. The auto `resetCollection` fixture
  empties it before each authenticated test, so tests sharing a worker stay independent too.
- **Teardown** — the same fixture calls `DELETE /Account/v1/User/{userId}`. Cleanup is best-effort:
  a failed delete warns instead of failing the run. Set `LOG_WORKER_USERS=1` to print every
  create/delete pair.

Authentication is declarative. demoqa keeps its session in cookies (`token`, `expires`, `userID`,
`userName`) rather than localStorage, so `workerAuthState` turns the worker user into a
`storageState` object and the `authenticated` option feeds it to the browser context:

```ts
test.describe('Profile — authenticated', () => {
  test.use({ authenticated: true }); // context is born logged in — no login form, no file on disk
});
```

Specs that exercise the login form itself take `freshUser` instead: demoqa's `GenerateToken`
invalidates an account's previous token, so a UI login as `workerUser` would silently break the
other tests in that worker.

This is what makes the suite safe to run fully in parallel and to shard across CI machines: no
shared mutable state and no cleanup ordering to get wrong. `playwright.config.ts` therefore runs
`fullyParallel: true` with 4 workers — a value tuned by measurement against the live site, where
response time, not local concurrency, is the limiting factor.

## Path aliases

Imports use aliases rather than relative paths (configured in `tsconfig.json`):

| Alias       | Resolves to    |
| ----------- | -------------- |
| `@api/*`    | `src/api/*`    |
| `@ui/*`     | `src/ui/*`     |
| `@common/*` | `src/common/*` |

```ts
import { test, expect } from '@common/fixtures/ui.fixtures';
import { AccountService } from '@api/services/account.service';
```

## Tags

| Tag      | Meaning                                     | Command              |
| -------- | ------------------------------------------- | -------------------- |
| `@smoke` | Minimal critical-path set for fast feedback | `npm run test:smoke` |
| `@a11y`  | axe-core accessibility scans                | `npm run test:a11y`  |

Tags are Playwright test tags, so they compose with everything else, e.g.
`npx playwright test --project=ui --grep @smoke`.

## CI

`.github/workflows/playwright.yml` runs on pushes and pull requests to `main`/`master`:

1. **`quality`** — `npm run typecheck`, `npm run lint`, `npm run format:check`. Nothing else runs if
   this fails.
2. **`test`** — needs `quality`; a 3-way shard matrix (`--shard=<n>/3`) with the `blob` reporter.
   Only chromium is installed. `BASE_URL` comes from a repository secret and `TEST_USER_PREFIX` is
   set per shard; no account secrets are needed because the run creates its own users. Each shard
   uploads its blob report as an artifact.
3. **`merge-reports`** — downloads every blob and runs
   `npx playwright merge-reports --reporter=html ./blob-report`, publishing one merged HTML report
   as the `playwright-report` artifact (30-day retention). It runs even when a shard fails.

npm downloads are cached via `actions/setup-node`'s `cache: npm`.

### Required repository secrets

| Secret     | Purpose                                       |
| ---------- | --------------------------------------------- |
| `BASE_URL` | Target environment, e.g. `https://demoqa.com` |

That is the only one. The framework provisions and deletes its own accounts, so there are no
long-lived test credentials to store or rotate.

## License

MIT — see [LICENSE](LICENSE).
