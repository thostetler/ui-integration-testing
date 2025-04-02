import { expect, test } from '@playwright/test';
import { ROUTES } from '@/constants';
import { configDotenv } from 'dotenv';
import { a11yCheck, ariaSnapshot, visualCheck } from '@/util/helpers';

configDotenv();

test.use({
  baseURL: process.env.SCIX_BASE_URL,
});

test('Feedback Correct Abstract form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-correct-abstract';
  await page.goto(ROUTES.FEEDBACK_CORRECT_ABS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Bibcode' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Authors' })).toBeEmpty();
    await expect(page.getByRole('row', { name: 'add author' }).getByRole('textbox').nth(1)).toBeEmpty();
    await expect(page.getByRole('row', { name: 'add author' }).getByRole('textbox').nth(2)).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Publication', exact: true })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Publication Date' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'URLs' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Abstract' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Keywords' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'References' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'User Comments' })).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Feedback Missing References form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-missing-references';
  await page.goto(ROUTES.FEEDBACK_MISSING_REFS);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
    await expect(page.getByRole('group').filter({ hasText: /^$/ }).getByPlaceholder('1998ApJ...501L..41Y')).toBeEmpty();
    await expect(page.getByRole('textbox', { name: '1998ApJ...501L..41Y' }).nth(1)).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Feedback Associated Articles form load properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'feedback-associated-articles';
  await page.goto(ROUTES.FEEDBACK_ASSOCIATED_ARTICLES);

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByRole('textbox', { name: 'Name' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Main Paper Bibcode' })).toBeEmpty();
    await expect(page.getByRole('group').filter({ hasText: /^$/ }).getByRole('textbox')).toBeEmpty();
    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});
