import { expect, test } from '@/setup/setup';
import { ROUTES } from '@/constants';
import { a11yCheck, ariaSnapshot, visualCheck } from '@scix/util/helpers';
import { configDotenv } from 'dotenv';

configDotenv();

test.use({
  baseURL: process.env.SCIX_BASE_URL,
});

test('Classic form loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'classic-form';
  await page.goto(ROUTES.CLASSIC_FORM);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.CLASSIC_FORM}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByRole('textbox', { name: 'Author' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Object' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Publication Date End' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'Abstract / Keywords' })).toBeEmpty();
    await expect(page.getByRole('combobox', { name: 'bibstem picker' })).toBeEmpty();
    await expect(page.getByRole('combobox', { name: 'sort' })).toBeEmpty();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Modern form loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'modern-form';
  await page.goto(ROUTES.ROOT);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.ROOT}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByTestId('search-input')).toBeEmpty();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test('Paper form loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'paper-form';
  await page.goto(ROUTES.PAPER_FORM);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.PAPER_FORM}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByRole('combobox', { name: 'bibstem picker' })).toBeEmpty();
    await expect(page.getByLabel('Year')).toBeEmpty();
    await expect(page.getByLabel('Volume')).toBeEmpty();
    await expect(page.getByLabel('Page / Id')).toBeEmpty();
    await expect(page.getByRole('textbox', { name: 'reference' })).toBeEmpty();
    await expect(page.getByLabel('List of Bibcodes')).toBeEmpty();
  });

  await test.step('Checking for aria regressions', async () => await ariaSnapshot(page, name));
  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});
