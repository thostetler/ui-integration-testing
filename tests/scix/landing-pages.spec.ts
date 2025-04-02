import { expect, test } from '@playwright/test';
import { ROUTES } from '@/constants';
import { a11yCheck, visualCheck } from '@/util/helpers';
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
    await expect(page.locator('form')).toMatchAriaSnapshot({ name: `${name}.aria.yml` });

    // author
    await expect(page.getByRole('textbox', { name: 'Author' })).toBeEmpty();

    // object
    await expect(page.getByRole('textbox', { name: 'Object' })).toBeEmpty();

    // pubdate
    await expect(page.getByRole('textbox', { name: 'Publication Date End' })).toBeEmpty();

    // title
    await expect(page.getByRole('textbox', { name: 'Title' })).toBeEmpty();

    // abstract/keywords
    await expect(page.getByRole('textbox', { name: 'Abstract / Keywords' })).toBeEmpty();

    // publications
    await expect(page.getByRole('combobox', { name: 'bibstem picker' })).toBeEmpty();

    // sort
    await expect(page.getByRole('combobox', { name: 'sort' })).toBeEmpty();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Modern form loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'modern-form';
  await page.goto(ROUTES.ROOT);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.ROOT}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.getByLabel('Start typing a query here to')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});

test.fixme('Paper form loads properly', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
  const name = 'paper-form';
  await page.goto(ROUTES.PAPER_FORM);
  await expect(page).toHaveURL(new RegExp(`${ROUTES.PAPER_FORM}`));

  await test.step('Confirm the page loaded correctly', async () => {
    await expect(page.locator('#landing-page-layout')).toContainText('Journal Search');
    await expect(page.locator('#landing-page-layout')).toContainText('Reference Query');
    await expect(page.locator('#landing-page-layout')).toContainText('Bibliographic Code Query');
    await expect(page.getByLabel('Publication')).toBeEmpty();
    await expect(page.getByLabel('Year')).toBeEmpty();
    await expect(page.getByLabel('Volume')).toBeEmpty();
    await expect(page.getByLabel('Page/ID')).toBeEmpty();
    await expect(page.getByLabel('Reference')).toBeEmpty();
    await expect(page.getByLabel('List of Bibcodes')).toBeEmpty();
  });

  await test.step('Checking for visual regressions', async () => await visualCheck(page, name));
  await test.step('Check for a11y violations', async () => await a11yCheck(page, name, testInfo));
});
