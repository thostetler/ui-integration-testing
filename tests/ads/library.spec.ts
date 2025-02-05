import { expect, Page, test } from '@playwright/test';
import { getAltTestEmailAccount, getTestEmailAccount } from '../../util/email';
import { configDotenv } from 'dotenv';

configDotenv();

const BASE_URL = process.env.ADS_BASE_URL;
const API_TIMEOUT = 30_000;

test.use({ baseURL: BASE_URL, storageState: 'playwright/.auth/login.json' });

const createNewLibrary = async (page: Page, name: string) => {
  const createLibButton = page.locator('button[class$="create-library"]');

  // go to the libraries page
  await page.goto('/user/libraries');

  // confirm we are on the library page and there are no libraries
  expect(page.url()).toMatch(/.*\/user\/libraries\/?$/);

  // create a new library via the prompt dialog
  page.once('dialog', (dialog) => dialog.accept(name));

  // create library
  await createLibButton.click();

  // confirm the request was made and grab the library id from the response
  const response = await page.waitForResponse((res) => {
    return res.url().match(/\/biblib\/libraries$/) && res.request().method() === 'POST';
  });
  const resData = await response.json();
  expect(resData.name).toBe(name);
  expect(resData.id).toBeTruthy();

  // confirm we are on the newly created library page
  await page.waitForURL(`**/user/libraries/${resData.id}`);
  expect(page.url(), 'should be on the newly created library page').toContain(resData.id);
  return resData;
};

test('Add/Remove Libraries', { tag: ['@smoke'] }, async ({ page }) => {
  const state = { name: 'aaa' };
  const libTitles = page.locator('table.libraries-list-container tbody tr .s-library-title');
  const libraryData = await createNewLibrary(page, state.name);

  // go back to the main list
  await page.goto('/user/libraries');

  // confirm it shows up in the main list, and click it, this should cause a navigation to the library details page
  await expect(libTitles.nth(0)).toHaveText(state.name);
  await libTitles.nth(0).click();
  await page.waitForURL(`**/user/libraries/${libraryData.id}`, { waitUntil: 'domcontentloaded' });
  if (page.url() !== `${BASE_URL}/user/libraries/${libraryData.id}`) {
    await page.goto(`/user/libraries/${libraryData.id}`);
  }

  // on the library page
  // confirm we are on the library page
  await expect(page.getByText('View Library', { exact: true })).toHaveClass(/active/);
  await expect(page.locator('.s-library-list')).toContainText(/.*You haven't added any bibcodes yet!.*/);

  // switch to the admin tab
  await page.getByText('Manage Access', { exact: true }).click();
  await expect(page.getByText('Manage Access', { exact: true })).toHaveClass(/active/);
  await expect(page.getByRole('heading', { name: 'This Library is Private' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Collaborators' })).toBeVisible();

  // the other tabs are all disabled
  await expect(page.locator('li.s-tab.s-disabled')).toHaveCount(4);

  // delete the library
  await page.locator("button[data-target='#library-actions']").dispatchEvent('click', { bubbles: true });
  await page.locator('.delete-library').click();
  await page.waitForResponse('**/biblib/documents/*', { timeout: API_TIMEOUT });
});

test('Add/Remove Bibcodes to Library', { tag: ['@smoke'] }, async ({ page }) => {
  const state = { name: 'papers' };
  const libraryData = await createNewLibrary(page, state.name);

  // go to the search page and add a bibcode
  await page.goto('/search/q=%20year%3A2000%20foo&sort=date%20desc%2C%20bibcode%20desc&p_=0');
  await page.locator("div[class='s-library-add-title__title']").click();
  await page.locator('#library-select').selectOption({ label: state.name });
  await page.locator('button.submit-add-to-library').click();
  const { number_added: papers } = (await page
    .waitForResponse('**/biblib/documents/*', { timeout: API_TIMEOUT })
    .then((res) => res.json())) as { number_added: number };

  // go back to the library page
  await page.goto(`/user/libraries/${libraryData.id}`);

  await expect(page.getByText(`Number of Papers: ${papers}`)).toBeVisible();
  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByText('BibTeX').click();
  await expect(page.getByText(`Exporting record(s) 1 to ${papers}`)).toBeVisible();
  await page.getByText('Metrics').click();
  await expect(page.getByRole('heading', { name: 'Papers', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Explore' }).click();
  await page.getByText('Author Network').click();
  await expect(page.getByRole('heading', { name: `Currently viewing data for ${papers}` })).toBeVisible();
  await page.getByRole('button', { name: 'Explore' }).click();
  await page.getByText('Paper Network').click();
  await expect(page.getByRole('heading', { name: `Currently viewing data for ${papers}` })).toBeVisible();
  await page.getByRole('button', { name: 'Explore' }).click();
  await page.getByText('Concept Cloud').click();
  await expect(page.getByRole('button', { name: 'Apply Filter to Search' })).toBeVisible();
  await page.getByText('Citation Helper').click();

  // delete a paper
  await page.getByText('View Library', { exact: true }).click();
  await page.locator('button.remove-record').first().click();
  await expect(
    page.waitForResponse(`**/biblib/documents/${libraryData.id}`, { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('number_removed', 1);
  await page.reload();
  await expect(
    page.waitForResponse(`**/biblib/libraries/${libraryData.id}*`, { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('metadata.num_documents', papers - 1);

  // delete multiple papers
  await page.getByLabel('select item 1', { exact: true }).check();
  await page.getByLabel('select item 2', { exact: true }).check();
  await page.getByLabel('select item 3', { exact: true }).check();
  await page.locator('button#bulk-delete').click();
  await expect(
    page.waitForResponse(`**/biblib/documents/${libraryData.id}`, { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('number_removed', 3);
  await page.reload();
  await expect(
    page.waitForResponse(`**/biblib/libraries/${libraryData.id}*`, { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('metadata.num_documents', papers - 4);

  // go to an abstract page and add a paper
  await page.goto('/abs/2000xmm..pres...10./abstract');
  await page.locator("div[class='s-library-add-title__title']").click();
  await page.locator('#library-select').selectOption({ label: state.name });
  await page.locator('button.submit-add-to-library').click();
  await expect(
    page.waitForResponse('**/biblib/documents/*', { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('number_added', 1);
  await page.goto(`/user/libraries/${libraryData.id}`, { waitUntil: 'domcontentloaded' });
  await expect(
    page.waitForResponse(`**/biblib/libraries/${libraryData.id}*`, { timeout: API_TIMEOUT }).then((res) => res.json()),
  ).resolves.toHaveProperty('metadata.num_documents', papers - 3);
});

test('Collaboration/Visibility works with libraries', { tag: ['@smoke'] }, async ({ browser }) => {
  test.slow();
  const state = { name: 'collab' };
  const defaultCtx = await browser.newContext({ storageState: 'playwright/.auth/login.json' });
  const altCtx = await browser.newContext({ storageState: 'playwright/.auth/alt-login.json' });
  const page = await defaultCtx.newPage();
  const altPage = await altCtx.newPage();
  const libraryData = await createNewLibrary(page, state.name);

  // (DEFAULT) go to the admin tab
  await page.getByText('Manage Access', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'This Library is Private' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Collaborators' })).toBeVisible();

  // (ALT) Assert we cannot access this library
  await altPage.goto(`/public-libraries/${libraryData.id}`);
  await altPage.waitForURL(`**/404`, { waitUntil: 'domcontentloaded' });
  expect(altPage.url(), 'Library should not be found, it is still private').toBe(`${BASE_URL}/404`);

  // (DEFAULT) make library public
  await page.getByRole('button', { name: 'Make this library public' }).click();

  // (ALT) Assert we can access this public library
  await altPage.goto(`/public-libraries/${libraryData.id}`);
  await expect(altPage.getByText(state.name), 'Public library can be seen').toBeVisible();

  // (DEFAULT) Transfer ownership to the alt user
  const biblibPermissionsRgx = new RegExp(`.*/biblib/permissions/${libraryData.id}`);
  const assertBiblibPermissions = async (page: Page, expected: Array<{ [email: string]: string[] }>) => {
    const permissionsResponse = await page.waitForResponse(
      (res) => {
        return biblibPermissionsRgx.test(res.request().url()) && res.request().method() === 'GET';
      },
      { timeout: API_TIMEOUT },
    );
    const permissions = (await permissionsResponse.json()) as Array<{ [email: string]: string[] }>;
    expect(permissions[0]).toStrictEqual(expected[0]);
  };

  await page.getByText('Manage Access', { exact: true }).click();
  await page.getByRole('button', { name: 'Transfer Ownership' }).click();
  await page.locator('.modal-body #textinput').fill(getAltTestEmailAccount().emailAddress);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.modal-footer button.confirm-button').click();
  const transferResponse = await page.waitForResponse(`**/biblib/transfer/${libraryData.id}`, { timeout: API_TIMEOUT });
  expect(transferResponse.status()).toBe(200);

  // (ALT) Assert we can access this library
  await expect(async () => {
    // TODO: Must go back to the main library page first for some reason
    await altPage.goto(`/user/libraries`, { waitUntil: 'domcontentloaded' });
    await altPage.goto(`/user/libraries/${libraryData.id}`, { waitUntil: 'domcontentloaded' });
    await expect(altPage.getByText('Manage Access', { exact: true })).toBeVisible();
    await altPage.getByText('Manage Access', { exact: true }).click();
  }).toPass();

  // make library private
  await altPage.getByRole('button', { name: 'Make this library private' }).click();

  // (DEFAULT) Assert we can no longer access this library
  await page.goto(`/public-libraries/${libraryData.id}`);
  await page.waitForURL(`**/404`, { waitUntil: 'domcontentloaded' });
  expect(page.url(), 'Library should not be found, it is now private').toBe(`${BASE_URL}/404`);

  // collaborators
  // (ALT) Add the default user as a collaborator
  // TODO: Must go back to the main library page first for some reason
  const email = getTestEmailAccount().emailAddress;
  const altEmail = getAltTestEmailAccount().emailAddress;
  await altPage.goto('/user/libraries');
  await altPage.goto(`/user/libraries/${libraryData.id}`);
  await altPage.reload({ waitUntil: 'domcontentloaded' });
  await altPage.getByText('Manage Access', { exact: true }).click();
  await assertBiblibPermissions(altPage, [{ [altEmail]: ['owner'] }]);
  await altPage.getByRole('button', { name: 'Add Collaborator' }).click();
  await altPage.locator('.modal-body #new_collab_email').fill(getTestEmailAccount().emailAddress);
  await altPage.locator('.modal-footer button[type="submit"]').click();
  await altPage.waitForResponse(biblibPermissionsRgx, { timeout: API_TIMEOUT });
  await assertBiblibPermissions(altPage, [{ [altEmail]: ['owner'] }, { [email]: ['read'] }]);

  // (ALT) Change the default user's permissions to write
  await altPage.getByLabel('Read Only permission selected').selectOption('write');
  await assertBiblibPermissions(altPage, [{ [altEmail]: ['owner'] }, { [email]: ['write'] }]);

  // (DEFAULT) Assert we have READ/WRITE access
  await page.goto(`/user/libraries/${libraryData.id}`);
  expect(await page.locator('button[data-target="#library-actions"]').textContent()).toContain(
    'You have write privileges',
  );
  await expect(page.getByText('Manage Access', { exact: true })).not.toBeAttached();

  // (ALT) Change the default user's permissions to admin
  await altPage.getByLabel('Read & Write permission').selectOption('admin');
  await assertBiblibPermissions(altPage, [{ [altEmail]: ['owner'] }, { [email]: ['admin'] }]);

  // (DEFAULT) Assert we have ADMIN access
  await page.reload();
  expect(await page.locator('button[data-target="#library-actions"]').textContent()).toContain(
    'You have admin privileges',
  );
  await expect(page.getByText('Manage Access', { exact: true })).toBeAttached();

  // (ALT) Remove the default user as a collaborator
  await altPage.getByRole('button', { name: 'Revoke Access' }).click();
  await altPage.getByLabel('Confirm Revoke Access').getByText('Revoke Access', { exact: true }).click();

  // (DEFAULT) Assert we no longer have access
  await page.reload();
  await page.goto(`/user/libraries/${libraryData.id}`);
  await page.waitForURL(`**/404`, { waitUntil: 'domcontentloaded' });
  expect(page.url(), 'Library should not be found, access revoked').toBe(`${BASE_URL}/404`);
});
