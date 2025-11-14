# Lighthouse Competitor Tests - Fix Summary

## Issues Identified

### 1. Use of Deprecated `networkidle` Wait Strategy
**Problem:** The `lighthouse-utils.ts` file was using `waitUntil: 'networkidle'` when navigating to URLs. This is discouraged by Playwright and can cause unreliable waits and timeouts, especially on pages with continuous background activity or slow-loading third-party resources.

**Impact:** Tests would hang indefinitely waiting for the network to be idle, which may never happen on modern web pages with analytics, ads, and tracking scripts.

### 2. Lack of Page State Cleanup Between Tests
**Problem:** After each Lighthouse audit, the page remained in its post-audit state. This could cause contamination between sequential tests, especially with the shared browser debugging port (9222).

**Impact:** Subsequent tests could inherit state from previous tests, leading to unpredictable behavior and timeouts.

### 3. Insufficient Delay Between Runs
**Problem:** Only 3 seconds delay between multiple runs of the same URL, which may not be enough time for browser cleanup and Lighthouse to fully reset.

**Impact:** Port conflicts and resource contention could cause subsequent runs to fail or timeout.

### 4. Invalid arXiv Article URL
**Problem:** The article URL `https://arxiv.org/abs/2301.12345` points to a non-existent article (404 error).

**Impact:** Tests would fail when trying to audit this URL.

## Fixes Applied

### 1. Fixed Navigation Wait Strategy
**File:** `/home/tim/code/ui-integration-testing/tests/competitors/lighthouse-utils.ts`

**Change:**
```typescript
// Before
await page.goto(url, {
  waitUntil: 'networkidle',
  timeout: lighthouseConfig.timeout,
});

// After
await page.goto(url, {
  waitUntil: 'load',
  timeout: lighthouseConfig.timeout,
});
await page.waitForLoadState('domcontentloaded');
```

**Rationale:** Using `'load'` waits for the page load event to fire, which is more reliable and predictable than `networkidle`. The additional `domcontentloaded` check ensures the DOM is ready before proceeding.

### 2. Added Page Cleanup After Each Audit
**File:** `/home/tim/code/ui-integration-testing/tests/competitors/lighthouse-utils.ts`

**Change:**
```typescript
// After successful audit
const result: LighthouseResult = { ... };

await page.goto('about:blank');
console.log(`    Page reset to about:blank`);

return result;
```

**Also added in error handler:**
```typescript
} catch (error) {
  lastError = error as Error;
  console.error(`    Attempt ${attempt + 1} failed:`, error.message);

  try {
    await page.goto('about:blank');
    console.log(`    Page reset after error`);
  } catch (resetError) {
    console.error(`    Failed to reset page:`, resetError);
  }

  // ... rest of error handling
}
```

**Rationale:** Navigating to `about:blank` after each audit ensures a clean slate for the next test, preventing state contamination and helping release resources.

### 3. Increased Delay Between Runs
**Files:**
- `/home/tim/code/ui-integration-testing/tests/competitors/search-lighthouse.spec.ts`
- `/home/tim/code/ui-integration-testing/tests/competitors/article-lighthouse.spec.ts`

**Change:**
```typescript
// Before
if (run > 1) {
  await page.waitForTimeout(3000);
}

// After
if (run > 1) {
  await page.waitForTimeout(5000);
}
```

**Rationale:** Increased delay gives more time for browser cleanup, debugging port reset, and system resources to stabilize between runs.

### 4. Fixed arXiv Article URL
**File:** `/home/tim/code/ui-integration-testing/tests/competitors/competitors-config.ts`

**Change:**
```typescript
// Before
article_url: 'https://arxiv.org/abs/2301.12345',

// After
article_url: 'https://arxiv.org/abs/0704.0001',
```

**Rationale:** Using a known valid arXiv article (0704.0001 is the first article in arXiv) ensures the URL is accessible.

## Testing Aids Created

### 1. URL Accessibility Test
**File:** `/home/tim/code/ui-integration-testing/tests/competitors/url-accessibility-test.spec.ts`

A diagnostic test that quickly verifies all competitor URLs are accessible before running the full Lighthouse suite.

**Run with:**
```bash
pnpm playwright test tests/competitors/url-accessibility-test.spec.ts --project competitors
```

### 2. Single Competitor Test
**File:** `/home/tim/code/ui-integration-testing/tests/competitors/test-one-competitor.spec.ts`

A minimal test that runs Lighthouse on Google Scholar twice to verify the fixes work without running the entire suite.

**Run with:**
```bash
pnpm playwright test tests/competitors/test-one-competitor.spec.ts --project competitors
```

## Expected Behavior After Fixes

1. **Navigation:** Tests should navigate reliably without hanging on `networkidle`
2. **Isolation:** Each test run should start with a clean browser state
3. **Stability:** Multiple runs should complete without timeouts
4. **Results:** All competitor URLs should be audited successfully
5. **Data Quality:** The 3 runs per URL should provide statistical significance

## How to Verify the Fixes

### Step 1: Test URL Accessibility
```bash
pnpm playwright test tests/competitors/url-accessibility-test.spec.ts --project competitors
```
This should show all URLs loading successfully with status codes < 400.

### Step 2: Test Single Competitor
```bash
pnpm playwright test tests/competitors/test-one-competitor.spec.ts --project competitors
```
Both runs should complete successfully without timeouts.

### Step 3: Run Search Lighthouse Tests
```bash
pnpm run test:competitors:search
```
All competitors' search pages should be audited 3 times each.

### Step 4: Run Article Lighthouse Tests
```bash
pnpm run test:competitors:article
```
All competitors' article pages (except Google Scholar which has none) should be audited 3 times each.

### Step 5: Run Full Competitor Suite
```bash
pnpm run test:competitors
```
All tests should complete successfully.

## Configuration Details

The competitors project in `playwright.config.ts` is configured with:
- **workers: 1** - Prevents port conflicts on the remote debugging port (9222)
- **Remote debugging port: 9222** - Required for playwright-lighthouse
- **Timeout: 360 seconds** (3 × 120s lighthouse timeout) - Adequate time for each audit

## Files Modified

1. `/home/tim/code/ui-integration-testing/tests/competitors/lighthouse-utils.ts` - Core utility fixes
2. `/home/tim/code/ui-integration-testing/tests/competitors/search-lighthouse.spec.ts` - Increased delay
3. `/home/tim/code/ui-integration-testing/tests/competitors/article-lighthouse.spec.ts` - Increased delay
4. `/home/tim/code/ui-integration-testing/tests/competitors/competitors-config.ts` - Fixed arXiv URL

## Files Created

1. `/home/tim/code/ui-integration-testing/tests/competitors/url-accessibility-test.spec.ts` - Diagnostic test
2. `/home/tim/code/ui-integration-testing/tests/competitors/test-one-competitor.spec.ts` - Minimal verification test
3. `/home/tim/code/ui-integration-testing/LIGHTHOUSE_FIX_SUMMARY.md` - This document
