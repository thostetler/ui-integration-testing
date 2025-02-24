import { expect, test } from '@/setup/setup';
import { configDotenv } from 'dotenv';
import { ROUTES } from '@/constants';
import { a11yCheck, visualCheck } from '@/util/helpers';
import { Page } from '@playwright/test';

configDotenv();

test.use({
  baseURL: process.env.ADS_BASE_URL,
});

// Example paper
const PAPER = {
  bibcode: '2022PhRvD.105j3539A',
  title: 'μ -hybrid inflation, gravitino dark matter, and stochastic gravitational wave background from cosmic strings',
};

// Define which sub-views you want to test:
const SUBVIEWS = [
  { name: 'Abstract', route: ROUTES.ABS_ABSTRACT },
  { name: 'Citations', route: ROUTES.ABS_CITATIONS },
  { name: 'References', route: ROUTES.ABS_REFERENCES },
  { name: 'Co-reads', route: ROUTES.ABS_COREADS },
  { name: 'Similar', route: ROUTES.ABS_SIMILAR },
  { name: 'Volume Content', route: ROUTES.ABS_VOLUME },
  { name: 'Graphics', route: ROUTES.ABS_GRAPHICS },
  { name: 'Export', route: ROUTES.ABS_EXPORT },
];

/**
 * A dictionary of route-specific checks. Each function asserts that
 * the page loaded correctly for that particular route.
 */
const routeAssertions: Record<string, (page: Page, title: string) => Promise<void>> = {
  [ROUTES.ABS_ABSTRACT]: async (page, title) => {
    await expect(page.getByRole('article')).toContainText(title);
  },
  [ROUTES.ABS_CITATIONS]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Papers that cite ${title}`);
    await expect(page.locator('.col-xs-1').first()).toBeVisible();
  },
  [ROUTES.ABS_REFERENCES]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Papers referenced by ${title}`);
    await expect(page.locator('.col-xs-1').first()).toBeVisible();
  },
  [ROUTES.ABS_COREADS]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Papers also read by those who read ${title}`);
    await expect(page.locator('.col-xs-1').first()).toBeVisible();
  },
  [ROUTES.ABS_SIMILAR]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Papers similar to ${title}`);
    await expect(page.locator('.col-xs-1').first()).toBeVisible();
  },
  [ROUTES.ABS_VOLUME]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Papers in the same volume as ${title}`);
    await expect(page.locator('.col-xs-1').first()).toBeVisible();
  },
  [ROUTES.ABS_GRAPHICS]: async (page, title) => {
    await expect(page.locator('#current-subview')).toContainText(`Graphics from ${title}`);
  },
  [ROUTES.ABS_EXPORT]: async (page) => {
    await expect(page.locator('#current-subview')).toContainText('Exporting record(s) 1 to 1 (total: 1)');
    expect(await page.getByLabel('export content').inputValue()).toContain('@ARTICLE');
  },
};

/**
 * Shared checks for any subview. This will be called after the route-specific checks.
 */
async function assertCommonElements(page: Page) {
  // Assert we can see the resources container
  await expect(page.locator('#resources-container')).toContainText('full text sources', { ignoreCase: true });

  // Assert we can see the right column graphics component
  await expect(page.locator('#right-col-container')).toContainText('Graphics', { ignoreCase: true });

  // Assert we can see the left side navigation
  await expect(page.locator('#left-column')).toBeVisible();
}

/**
 * Main helper that checks a given route by calling route-specific assertions
 * plus the shared checks.
 */
async function assertContentLoaded(page: Page, route: string, title: string) {
  // Run the route-specific checks
  await routeAssertions[route](page, title);
  // Then check elements common to all routes
  await assertCommonElements(page);
}

test.describe('Abstract pages', () => {
  for (const { name, route } of SUBVIEWS) {
    test(`${name} page loads properly`, { tag: ['@smoke'] }, async ({ page, cacheRoute }, testInfo) => {
      await cacheRoute.GET('**/v1/search/query*');

      // Build the test name for snapshots and a11y logs
      const testName = `abs-${name.toLowerCase().replace(/\s+/g, '-')}`;

      // Navigate to the route
      await page.goto(`${ROUTES.ABS}/${PAPER.bibcode}/${route}`, { waitUntil: 'domcontentloaded' });

      // Verify URL is correct
      await expect(page).toHaveURL(new RegExp(`${PAPER.bibcode}/${route}`));

      // Confirm page loaded by running all the relevant checks
      await test.step('Confirm the page loaded correctly', async () => {
        await expect(async () => {
          await assertContentLoaded(page, route, PAPER.title);
        }).toPass();
      });

      // Visual regression check
      await test.step('Checking for visual regressions', async () => {
        await visualCheck(page, testName);
      });

      // Accessibility check
      await test.step('Check for a11y violations', async () => {
        await a11yCheck(page, testName, testInfo);
      });
    });
  }
});
