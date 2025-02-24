import { expect, type Page, test, type TestInfo } from '@playwright/test';
import { A11Y_TAGS, MAX_A11Y_VIOLATIONS, ROUTES } from '@/constants';
import AxeBuilder from '@axe-core/playwright';

test.use({
  baseURL: process.env.ADS_BASE_URL,
});

const visualCheck = (page: Page, name: string) => async () => {
  await expect(page.locator('#content-container')).toHaveScreenshot(`${name}.png`);
};

const a11yCheck = (page: Page, name: string, testInfo: TestInfo) => async () => {
  const a11yResults = await new AxeBuilder({ page }).withTags(A11Y_TAGS).analyze();
  await testInfo.attach(`a11y-results-${name}`, {
    body: JSON.stringify(a11yResults, null, 2),
    contentType: 'application/json',
  });
  expect(a11yResults.violations.length).toBeLessThanOrEqual(MAX_A11Y_VIOLATIONS);
};

test('Feedback Correct Abstract form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-correct-abstract';
  await page.goto(ROUTES.FEEDBACK_CORRECT_ABS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit or Correct an Abstract for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByPlaceholder('1999ApJ...511L..65Y')).toBeEmpty();
    await expect(page.getByLabel('Title')).toBeEmpty();
    await expect(page.getByLabel('Publication *')).toBeEmpty();
    await expect(page.getByPlaceholder('YYYY-MM-DD')).toBeEmpty();
    await expect(page.getByLabel('URL 1 type')).toHaveValue('none');
    await expect(page.getByLabel('URL 1', { exact: true })).toBeEmpty();
    await expect(page.getByLabel('Abstract', { exact: true })).toBeEmpty();
    await expect(page.getByLabel('Keyword')).toBeEmpty();
    await expect(page.getByLabel('Reference')).toBeEmpty();
    await expect(page.getByLabel('User Comments')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Feedback Missing References form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-missing-references';
  await page.goto(ROUTES.FEEDBACK_MISSING_REFS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit missing references for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByLabel('Citing Bibcode')).toBeEmpty();
    await expect(page.getByLabel('Cited Bibcode')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});

test('Feedback Associated Articles form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-associated-articles';
  await page.goto(ROUTES.FEEDBACK_ASSOCIATED_ARTICLES);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('h2')).toContainText('Submit Associated Articles for the ADS Abstract Service');
    await expect(page.getByPlaceholder('John Smith')).toBeEmpty();
    await expect(page.getByPlaceholder('john@example.com')).toBeEmpty();
    await expect(page.getByLabel('Relation type *')).toHaveValue('none');
  });

  await test.step('Checking for visual regressions', visualCheck(page, name));
  await test.step('Check for a11y violations', a11yCheck(page, name, testInfo));
});
