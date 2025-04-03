import { Page } from '@playwright/test';

type BBB = {
  getService: (service: string) => {
    getApiAccess: () => Promise<{ access_token: string }>;
  };
};

export const getAPIToken = async (page: Page): Promise<string> => {
  await page.waitForFunction(() => window['bbb']);
  return await page.evaluate(async () => {
    const res = await (window['bbb'] as BBB).getService('Api').getApiAccess();
    if (res && res.access_token) {
      return res.access_token;
    }
  });
};
