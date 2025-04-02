import { expect, test } from '@playwright/test';
import { ROUTES } from '@/constants';
import { a11yCheck, ariaSnapshot, visualCheck } from '@/util/helpers';
import { configDotenv } from 'dotenv';

configDotenv();

test.use({
  baseURL: process.env.SCIX_BASE_URL,
});

test('Login page loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'login';
  await page.goto(ROUTES.LOGIN);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.LOGIN}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#form-label')).toContainText('Login');
    await expect(page.locator('#email')).toBeEmpty();
    await expect(page.locator('#password')).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Register page loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'register';
  await page.goto(ROUTES.REGISTER);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.REGISTER}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#form-label')).toContainText('Register');
    await expect(page.getByRole('textbox', { name: 'email@example.com' })).toBeEmpty();
    await expect(page.locator('#password')).toBeEmpty();
    await expect(page.locator('#confirmPassword')).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Forgot password page loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'forgot-password';
  await page.goto(ROUTES.FORGOT_PASSWORD);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.FORGOT_PASSWORD}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#form-label')).toContainText('Forgot Password');
    await expect(page.getByRole('textbox', { name: 'email@example.com' })).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});
