import { APIRequestContext, BrowserContext, expect, Page, request } from '@playwright/test';

type BootstrapResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: 'bearer';
  username: string;
  scopes: string[];
  anonymous: boolean;
  client_id: string;
  client_secret: string;
  ratelimit: number;
  client_name: string;
  individual_ratelimits: number | null;
  given_name: string | null;
  family_name: string | null;
};

type Credentials = {
  emailAddress: string;
  password: string;
};
export const loginUser = async (page: Page, credentials: Credentials) => {
  await page.goto('/user/account/login', { waitUntil: 'domcontentloaded' });

  const userData = await page.evaluate(() => {
    const bbb = window['bbb'];
    if (bbb) {
      return bbb.getObject('User').getUserData();
    }
    return null;
  });

  if (userData?.user === credentials.emailAddress) {
    // already logged in as this user
    return;
  }

  // fill out form
  await page.locator('#email').fill(credentials.emailAddress);
  await page.locator('#password').fill(credentials.password);

  // submit
  await page.locator('.submit-login').click();
  const res = await page.waitForResponse('**/accounts/bootstrap');
  const bootstrapData = (await res.json()) as BootstrapResponse;
  expect(bootstrapData.username).toBe(credentials.emailAddress);
};

export const logoutUser = async (page: Page) => {
  await page.locator('.logout').click();
};
