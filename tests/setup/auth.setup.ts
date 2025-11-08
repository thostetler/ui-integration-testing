import { test as setup } from '@playwright/test';
import { join } from 'path';
import { configDotenv } from 'dotenv';

configDotenv();

const authFile = join(__dirname, '../playwright/.auth/user.json');

const scixAuthUrl = `${process.env.SCIX_BASE_URL}/2019ApJ...875L...1E/abstract`;
// const bbbAuthUrl = `${process.env.ADS_BASE_URL}/2019ApJ...875L...1E/abstract`;

setup('authenticate', async ({ page }) => {
  await page.goto(scixAuthUrl);
  await page.waitForLoadState('networkidle');
  await page.context().storageState({ path: authFile });

  // await page.goto(bbbAuthUrl);
  // await page.waitForLoadState('networkidle');
  // await page.context().storageState({ path: authFile });
});
