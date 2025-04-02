import { expect, test } from '@playwright/test';
import { ROUTES } from '@/constants';
import { a11yCheck, visualCheck } from '@/util/helpers';

test.use({
  baseURL: process.env.SCIX_BASE_URL,
});

test.fixme('Login page loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'login';
  await page.goto(ROUTES.LOGIN);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.LOGIN}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('legend')).toContainText('Log in to ADS');
    await expect(page.getByPlaceholder('Enter email')).toBeEmpty();
    await expect(page.getByPlaceholder('Password')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Register page loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'register';
  await page.goto(ROUTES.REGISTER);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.REGISTER}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByText('Register for an ADS Account')).toBeVisible();
    await expect(page.getByPlaceholder('First Name')).toBeEmpty();
    await expect(page.getByPlaceholder('Last Name')).toBeEmpty();
    await expect(page.getByPlaceholder('me@example.com')).toBeEmpty();
    await expect(page.getByLabel('Password * at least 8')).toBeEmpty();
    await expect(page.getByLabel('Re-enter Password *')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

