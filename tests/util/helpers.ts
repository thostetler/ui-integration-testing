import { expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { A11Y_TAGS, MAX_A11Y_VIOLATIONS } from '@/constants';

export const ariaSnapshot = async (page: Page, name: string) => {
  const adsMain = page.locator('#content-container');
  const scixMain = page.locator('#main-content');

  if (await adsMain.isVisible()) {
    await expect(adsMain).toMatchAriaSnapshot({ name: `${name}.aria.yml` });
  }
  if (await scixMain.isVisible()) {
    await expect(scixMain).toMatchAriaSnapshot({ name: `${name}.aria.yml` });
  }
};

export const visualCheck = async (page: Page, name: string) => {
  const adsMain = page.locator('#content-container');
  const scixMain = page.locator('#main-content');

  await expect(async () => {
    if (await adsMain.isVisible()) {
      await expect(adsMain).toHaveScreenshot(`${name}.png`, { threshold: 0.4 });
    }
    if (await scixMain.isVisible()) {
      await expect(scixMain).toHaveScreenshot(`${name}.png`, { threshold: 0.4 });
    }
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

export const isScix = async (page: Page) => {
  const main = page.locator('#main-content');
  return await main.isVisible();
};
