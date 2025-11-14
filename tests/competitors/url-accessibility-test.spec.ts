/**
 * Quick diagnostic test to verify competitor URLs are accessible
 */

import { test, expect } from '@playwright/test';
import { competitors } from './competitors-config';

test.describe('Competitor URL Accessibility Check', () => {
  for (const competitor of competitors) {
    test(`${competitor.name} - Search URL accessibility`, async ({ page }) => {
      test.setTimeout(60000);

      console.log(`Testing ${competitor.name} search URL: ${competitor.search_url}`);

      const response = await page.goto(competitor.search_url, {
        waitUntil: 'load',
        timeout: 30000,
      });

      expect(response?.status()).toBeLessThan(400);
      console.log(`  Status: ${response?.status()}`);
      console.log(`  URL loaded successfully`);
    });

    if (competitor.article_url) {
      test(`${competitor.name} - Article URL accessibility`, async ({ page }) => {
        test.setTimeout(60000);

        console.log(`Testing ${competitor.name} article URL: ${competitor.article_url}`);

        const response = await page.goto(competitor.article_url, {
          waitUntil: 'load',
          timeout: 30000,
        });

        expect(response?.status()).toBeLessThan(400);
        console.log(`  Status: ${response?.status()}`);
        console.log(`  URL loaded successfully`);
      });
    }
  }
});
