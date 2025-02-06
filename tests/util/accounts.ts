import type { Page } from '@playwright/test';
import { User } from '@/fixtures/user';
import { expect, test as setup } from '@/setup/setup';
import { getLatestADSEmail } from '../../provider/gmail';
import { API_TIMEOUT } from '@/constants';

const extractRegisterToken = (body: string): string | null => {
  if (typeof body === 'string') {
    const tokenPattern = /\/#user\/account\/verify\/register\/([^\s"]+)/;
    const match = body.match(tokenPattern);
    return match ? match[1] : null;
  }

  throw new Error(`${body} is not a string`);
};

export const verifyUser = async (page: Page, user: User) => {
  await setup.step('Got verify email and verified new user', async () => {
    await expect(async () => {
      await page.waitForTimeout(5_000);
      const latestEmail = await getLatestADSEmail(user.email);

      const registerToken = extractRegisterToken(latestEmail.body);
      expect(registerToken, 'Verify token was found in email').not.toBeNull();

      await page.goto(`/user/account/verify/register/${registerToken}`);
      const res = await page.waitForResponse('**/v1/accounts/bootstrap', { timeout: API_TIMEOUT });
      await expect(res.json(), 'should be logged in').resolves.toHaveProperty('username', user.email);
    }).toPass();
  });
};
