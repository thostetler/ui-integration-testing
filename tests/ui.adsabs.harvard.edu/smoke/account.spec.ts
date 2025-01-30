import { test, expect } from '@playwright/test';
import {ms, getInbox, getTestEmailAccount, waitForLatestEmail, getRandomPassword} from '../../../util/email';
import {configDotenv} from 'dotenv';
import { Email } from 'mailslurp-client';

configDotenv();

test.use({
  baseURL: 'https://qa.adsabs.harvard.edu'
});

function extractRegisterToken(email: Email): string | null {
  const html = email.body;
  if (typeof html === 'string') {
    const tokenPattern = /\/#user\/account\/verify\/register\/([^\s"]+)/;
    const match = html.match(tokenPattern);
    return match ? match[1] : null;
  }

  throw new Error(`${html} is not a string`)
}

test('Can register an account', async ({ page }) => {
  test.skip(!ms, 'MailSlurp API key not set');
  const {id, emailAddress} = await getInbox();
  const password = await getRandomPassword(page);
  await page.goto("/user/account/register");

  // fill out form
  await page.locator('#email').fill(emailAddress);
  await page.locator('#password1').fill(password);
  await page.locator('#password2').fill(password);

  // submit
  await page.locator('button[data-form-name=\'register\']').click();

  const email = await waitForLatestEmail(id);

  const registerToken = extractRegisterToken(email);
  expect(registerToken).not.toBeNull();

  // verify email
  await page.goto(`/user/account/verify/register/${registerToken}`)

  const bootstrapResponseListener = async (response) => {
    if (response.url().includes('/accounts/bootstrap')) {

      // verify that the bootstrap response contains the correct username (i.e. that we logged in)
      const bootstrapResponse = await response.json();
      expect(bootstrapResponse).toHaveProperty('username', emailAddress);
    }
  }
  page.on('response', bootstrapResponseListener);
  await page.waitForURL('/');
  page.off('response', bootstrapResponseListener);

  // delete the account
  await page.goto('/user/settings/delete');
  page.on('dialog', async dialog => {
    await dialog.accept();
  });
  await page.locator('#delete-account').click();
});

test('Can login and get to all settings pages', async ({ page }) => {
  const { emailAddress, password } = getTestEmailAccount();
  test.skip(!emailAddress, 'TEST_EMAIL not set');
  test.skip(!password, 'TEST_PASSWORD not set');

  await page.goto("/user/account/login");

  // fill out form
  await page.locator('#email').fill(emailAddress);
  await page.locator('#password').fill(password);

  // submit
  await page.locator('.submit-login').click();
  await page.waitForURL('/');
  
  // can we get to and see the app settings page?
  await page.goto('/user/settings/application');
  await expect(page.locator('.panel-heading')).toContainText('Search Settings');

  // can we get to and see the ORCiD settings page?
  await page.goto('/user/settings/orcid');
  await expect(page.locator('.panel-heading')).toContainText('ORCID Settings');

  // can we get to and see the library link server settings page?
  await page.goto('/user/settings/librarylink');
  await expect(page.locator('.panel-heading')).toContainText('Library Link Server');

  // can we get to and see the export settings page?
  await page.goto('/user/settings/export');
  await expect(page.locator('.panel-heading')).toContainText('Export Settings');

  // can we get to and see the myADS settings page?
  await page.goto('/user/settings/myads');
  await expect(page.locator('.panel-heading')).toContainText('myADS');

  // can we get to and see the change email settings page?
  await page.goto('/user/settings/email');
  await expect(page.locator('.panel-heading')).toContainText('Change Email Address');

  // can we get to and see the change password settings page?
  await page.goto('/user/settings/password');
  await expect(page.locator('.panel-heading')).toContainText('Change Your Password');

  // can we get to and see the API Token settings page?
  await page.goto('/user/settings/token');
  await expect(page.locator('.panel-heading')).toContainText('API Token');

  // can we get to and see the delete account settings page?
  await page.goto('/user/settings/delete');
  await expect(page.locator('.panel-heading')).toHaveText('Delete Account');

  // can we get to and see libraries page?
  await page.goto('/user/libraries');
  await expect(page.locator('span.h2')).toHaveText('My Libraries');
});
