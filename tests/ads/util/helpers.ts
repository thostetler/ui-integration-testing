import { expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y_TAGS, MAX_A11Y_VIOLATIONS } from '@/constants';

const CONTENT_SELECTOR = '#content-container';
const SCREENSHOT_THRESHOLD = 0.4;

export const ariaSnapshot = async (page: Page, name: string) => {
  await expect(page.locator(CONTENT_SELECTOR)).toMatchAriaSnapshot({ name: `${name}.aria.yml` });
};

export const visualCheck = async (page: Page, name: string) => {
  await expect(async () => {
    await expect(page.locator(CONTENT_SELECTOR)).toHaveScreenshot(`${name}.png`, {
      threshold: SCREENSHOT_THRESHOLD,
    });
  }).toPass({ timeout: 10_000 });
};

export const a11yCheck = async (page: Page, name: string, testInfo: TestInfo) => {
  const a11yResults = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
  await testInfo.attach(`a11y-results-${name}`, {
    body: JSON.stringify(a11yResults, null, 2),
    contentType: 'application/json',
  });
  expect(a11yResults.violations.length).toBeLessThanOrEqual(MAX_A11Y_VIOLATIONS);
};

export const searchParamsToString = (qs: URLSearchParams) => {
  return Array.from(qs.entries())
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
};

export const logNetworkRequests = async (page: Page, filter?: (url: string) => boolean) => {
  page.on('request', (request) => {
    if ((typeof filter === 'function' && filter(request.url())) || typeof filter !== 'function') {
      console.log('>>', request.method(), request.url());
    }
  });
  page.on('response', (response) => {
    if ((typeof filter === 'function' && filter(response.url())) || typeof filter !== 'function') {
      console.log('<<', response.status(), response.url());
    }
  });
};
