# DemoQA Playwright Framework

End-to-end test automation for [demoqa.com](https://demoqa.com) — a public demo site with a Book Store application (catalog, login, profile, collection management) backed by a REST API.

## What's covered

**UI (`src/ui/tests/`)**
- Book catalog: search, pagination, row navigation
- Book detail: metadata rendering, add-to-collection, back navigation
- Login & Register (reCAPTCHA-gated smoke only)
- Profile: collection listing, single/bulk delete, logout

**API (`src/api/tests/`)**
- `Account/v1/*` — token generation, login, user creation
- `BookStore/v1/*` — list, add, delete books

## Stack

- Playwright Test (TypeScript), chromium-only, serial
- Page Object Model with abstract `BasePage`
- Two-layer fixture chain: core (`fixtures.ts`) → UI (`page-setup.ts`)
- JSON Schema validation for API responses (AJV)

## Quick start

```bash
npm install
npx playwright install chromium

export TEST_USERNAME=admin
export TEST_PASSWORD='Password123@'

npx playwright test                 # all tests
npx playwright test --ui            # UI mode
npx playwright show-report          # last report
```

## Layout

```
src/
├── common/       # config, fixtures, helpers, types
├── api/          # services + tests + schemas
└── ui/           # page objects, flows, tests
```

## Notes

- Tests share a single `admin` account; any test that asserts collection state wipes it in setup.
- Ad/tracker traffic is route-blocked at the fixture level to keep runs stable.
