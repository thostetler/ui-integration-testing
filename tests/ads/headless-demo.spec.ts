import { test, expect } from '@playwright/test';

test('headless mode demonstration', async ({ page }) => {
  // Visit a public website to demonstrate headless execution
  await page.goto('https://example.com');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Verify we can interact with the page
  const title = await page.title();
  console.log(`Page title: ${title}`);
  expect(title).toContain('Example');

  // Verify we can find elements on the page
  const heading = await page.locator('h1').textContent();
  console.log(`Heading: ${heading}`);
  expect(heading).toContain('Example Domain');
});
