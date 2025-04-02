import { Page } from '@playwright/test';
import { isScix } from '@/util/helpers';

type BBB = {
  getService: (service: string) => {
    getApiAccess: () => Promise<{ access_token: string }>;
  };
};

export const getAPIToken = async (page: Page): Promise<string> => {
  if (await isScix(page)) {
    return await page.evaluate(() => {
      const state = window.localStorage.getItem('nectar-app-state');
      if (state) {
        const parsedState = JSON.parse(state);
        return parsedState?.state?.user?.access_token;
      }
    });
  }

  await page.waitForFunction(() => window['bbb']);
  return await page.evaluate(async () => {
    const res = await (window['bbb'] as BBB).getService('Api').getApiAccess();
    if (res && res.access_token) {
      return res.access_token;
    }
  });
};
