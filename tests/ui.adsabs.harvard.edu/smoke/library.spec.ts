import {expect, test} from '@playwright/test';
import {getTestEmailAccount} from '../../../util/email';
import {loginUser, logoutUser, makeAPICall} from '../../../util/auth';

test.use({
  baseURL: 'https://qa.adsabs.harvard.edu'
});

test.beforeEach(async ({page}) => {
  const { emailAddress, password } = getTestEmailAccount();
  test.skip(!emailAddress, 'TEST_EMAIL not set');
  test.skip(!password, 'TEST_PASSWORD not set');
  await loginUser(page, { emailAddress, password });
  await page.goto('/user/libraries');
  const res = await makeAPICall(page, '/biblib/libraries', {
    baseURL: 'https://qa.adsabs.harvard.edu/v1',
    method: 'GET',
  });
  console.log('RES', res);
});

test('Can get to and create/delete a library from the library dashboard', async ({ page }) => {
  const state = { name: 'aaaa' };
  const createLibButton = page.locator('button[class$="create-library"]')
  const libTitles = page.locator('table.libraries-list-container tbody tr .s-library-title');



  // create a new library, get the id from the resulting api response
  let id: string;
  page.once('dialog', async dialog => {
    await dialog.accept(state.name)
    const response = await page.waitForResponse(res => res.url().match(/\/biblib\/libraries$/) && res.request().method() === 'POST');
    const resData = await response.json();
    console.log('RESPONSE', resData);
    expect(resData.name).toBe(state.name);

    id = resData.id;
  });

  // create library
  await createLibButton.click();

  // confirm it shows up in the main list
  await expect(libTitles.nth(0)).toHaveText(state.name);

  // click it, go in and delete the library
  await libTitles.nth(0).click();
  await page.waitForURL(`**/user/libraries/${id}`);
  await page.locator('button[data-target=\'#library-actions\']').click();
  await page.locator('button[class$=\'delete-library\']').click();

  // confirm we are back to the main list and the library is gone
  await page.waitForURL('**/user/libraries');
  await expect(libTitles.nth(0)).not.toHaveText(state.name);
});
