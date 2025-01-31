import {expect, Page} from '@playwright/test';
import {BetterFetch, BetterFetchOption, createFetch, CreateFetchOption} from '@better-fetch/fetch'

type BootstrapResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  token_type: "bearer";
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
}

type Credentials = {
  emailAddress: string,
  password: string,
}
export const loginUser = async (page: Page, credentials: Credentials) => {
  await page.goto("/user/account/login");

  // fill out form
  await page.locator('#email').fill(credentials.emailAddress);
  await page.locator('#password').fill(credentials.password);

  // submit
  await page.locator('.submit-login').click();
  const res = await page.waitForResponse('**/accounts/bootstrap')
  const bootstrapData = await res.json() as BootstrapResponse;
  expect(bootstrapData.username).toBe(credentials.emailAddress);
}

export const logoutUser = async (page: Page) => {
  await page.locator('.logout').click();
}

type BBB = {
  getService: (service: string) => {
    getApiAccess: () => Promise<{ access_token: string }>;
  }
}
export const getBBBHandle = async (page: Page) => await page.evaluateHandle<BBB>('bbb');

export const getUserToken = async (page: Page): Promise<string> => {
  return await page.evaluate(async () => {
    try {
      const res = await (window.bbb as BBB).getService('Api').getApiAccess();
      if (res && res.access_token) {
        return res.access_token;
      }
    } catch (error) {
      console.error('Failed to get user token:', error);
    }
  });
}

export const makeAPICall = async (page: Page, path: string, options: BetterFetchOption) => {
  const $fetch = createFetch({
    baseURL: options.baseURL,
    auth: {
      type: 'Bearer',
      token: await getUserToken(page),
    },
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
    body: options.body,
    method: options.method,
    query: options.query,
    params: options.params,
    throw: true
  });

 return await page.evaluate(async function ([$fetch, path])  {
    try {
      const res = await $fetch(path, { window: this });
      return {res, error: null};
    } catch (error) {
      return {res: null, error};
    }
  }, [$fetch, path] as [typeof $fetch, string]);
}
