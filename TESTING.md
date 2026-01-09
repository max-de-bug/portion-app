# Testing Guide

Portion uses Playwright for end-to-end and API testing.

## Setup

```bash
# Install dependencies (includes Playwright)
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### All Tests
```bash
npm run test
```

### UI Mode (Interactive)
```bash
npm run test:ui
```

### Headed Mode (See Browser)
```bash
npm run test:headed
```

### Debug Mode
```bash
npm run test:debug
```

### API Tests Only
```bash
npm run test:api
```

## Test Structure

```
tests/
├── e2e/
│   └── app.spec.ts          # End-to-end UI tests
└── unit/
    └── api-routes.test.ts   # API endpoint tests
```

## Test Coverage

### E2E Tests (`tests/e2e/app.spec.ts`)

- ✅ Landing page loads
- ✅ Wallet connection UI
- ✅ Dashboard navigation
- ✅ Network switcher
- ✅ Agent chat modal
- ✅ AI services display

### API Tests (`tests/unit/api-routes.test.ts`)

- ✅ Health check endpoint
- ✅ Services listing
- ✅ Payment preparation (402 responses)
- ✅ Yield calculation
- ✅ Service execution flow
- ✅ Pricing validation
- ✅ Error handling

## Writing New Tests

### Example: Testing a New Feature

```typescript
import { test, expect } from "@playwright/test";

test.describe("My New Feature", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/dashboard");
    // Your test code here
    await expect(page.getByText("Expected Text")).toBeVisible();
  });
});
```

### Example: Testing API Endpoint

```typescript
test("should handle new endpoint", async ({ request }) => {
  const response = await request.get("http://localhost:3001/x402/new-endpoint");
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty("expectedField");
});
```

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/playwright.yml` for configuration.

## Debugging Failed Tests

1. **View HTML Report**: `npx playwright show-report`
2. **Run in Debug Mode**: `npm run test:debug`
3. **Run Specific Test**: `npx playwright test tests/e2e/app.spec.ts -g "test name"`
4. **Capture Screenshot**: Tests automatically capture screenshots on failure

## Best Practices

1. **Use descriptive test names**: `"should display error when wallet disconnected"`
2. **Test user flows, not implementation**: Focus on what users do
3. **Keep tests independent**: Each test should work standalone
4. **Use wait strategies**: `waitForTimeout` is last resort
5. **Mock external services**: Don't hit real APIs in tests
6. **Clean up after tests**: Reset state if needed

## Environment Variables for Tests

```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_API_URL=http://localhost:3001
```
