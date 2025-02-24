import { expect, test } from '@/setup/setup';
import { configDotenv } from 'dotenv';
import { ExportSettingsPage, MyADSSettingsPage, SearchSettingsPage } from '@/fixtures/settings';

configDotenv();

test.use({
  baseURL: process.env.ADS_BASE_URL,
});

test('Can see and modify application settings', { tag: ['@auth', '@smoke'] }, async ({ loggedInPage: [page] }) => {
  const settingsPage = new SearchSettingsPage(page);
  await settingsPage.goto();
  await settingsPage.assertHeader();
  await settingsPage.resetUserData();

  await expect(async () => {
    await settingsPage.setAuthorsPerResult(5);
  }).toPass();

  await expect(async () => {
    await settingsPage.setExternalLinkBehavior('Open new tab');
  }).toPass();

  await expect(async () => {
    await settingsPage.setDefaultHomePage('Classic Form');
  }).toPass();

  await expect(async () => {
    await settingsPage.setDefaultDatabase('Physics');
  }).toPass();

  await expect(async () => {
    await settingsPage.setResultsListSideBars('Hide');
  }).toPass();
});
test('Can see and modify export settings', { tag: ['@auth', '@smoke'] }, async ({ loggedInPage: [page] }) => {
  const exportSettingsPage = new ExportSettingsPage(page);
  await exportSettingsPage.goto();
  await exportSettingsPage.assertHeader();
  await exportSettingsPage.resetUserData();

  await expect(() => exportSettingsPage.setDefaultExportFormat('Icarus')).toPass();
  await test.step('add/remove custom formats', async () => {
    await exportSettingsPage.addCustomFormat('Custom Format', 'custom-format');
  });
  await expect(() => exportSettingsPage.setBibTeXExportKeyFormat('custom-format')).toPass();
  await expect(() => exportSettingsPage.setTeXJournalNameHandling('Use Journal Abbreviations')).toPass();
  await expect(() => exportSettingsPage.setBibTeXMaxAuthors('100')).toPass();
  await expect(() => exportSettingsPage.setBibTeXAuthorCutoff('100')).toPass();
  await expect(() => exportSettingsPage.setBibTeXABSExportKeyFormat('custom-abs-format')).toPass();
  await expect(() => exportSettingsPage.setBibTeXABSMaxAuthors('100')).toPass();
  await expect(() => exportSettingsPage.setBibTeXABSAuthorCutoff('100')).toPass();

  await exportSettingsPage.assertUserData('export-settings');
});
test('Can see, add, and modify myADS settings', { tag: ['@auth'] }, async ({ loggedInPage: [page] }) => {
  const myADSSettingsPage = new MyADSSettingsPage(page);
  await myADSSettingsPage.goto();
  await myADSSettingsPage.assertHeader();

  await test.step('make a query arXiv notification', async () => {
    await myADSSettingsPage.createNewNotification('arxiv');
    await page.getByPlaceholder('star OR planet').fill('moon');
    await page.getByLabel('astro-ph: Astrophysics').click({ force: true });
    await myADSSettingsPage.submitNotification();
    await expect(page.locator('tbody')).toContainText('star - Recent Papers');
    await expect(page.locator('tbody')).toContainText('arXiv');
  });

  await test.step('disable and edit the notification', async () => {
    await myADSSettingsPage.disableNotification();
  });

  // await page.getByRole('button', { name: 'Create' }).click();
  // await expect(page.locator('tbody')).toContainText('star - Recent Papers');
  // await expect(page.locator('tbody')).toContainText('arXiv');
  // await page.getByRole('button', { name: 'Actions' }).click();
  // await page.getByText('DISABLED').click();
  // await page.getByRole('button', { name: 'Actions' }).click();
  // await page.getByRole('menuitem', { name: 'Edit' }).click();
  // await page.getByLabel('nucl-th: Nuclear Theory').check();
  // await page.getByRole('button', { name: 'Save notification' }).click();
  // await expect(page.locator('tbody')).toContainText('test notification');
  // await page.getByRole('button', { name: 'Actions' }).click();
  // page.once('dialog', (dialog) => {
  //   console.log(`Dialog message: ${dialog.message()}`);
  //   dialog.dismiss().catch(() => {});
  // });
  // await page.getByRole('menuitem', { name: 'Delete' }).click();
});
test.fixme('Can generate a new API token', { tag: ['@auth'] }, () => {});
