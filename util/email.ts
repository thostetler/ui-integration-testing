import { InboxDto, MailSlurp } from 'mailslurp-client';
import { configDotenv } from 'dotenv';
import { Page } from '@playwright/test';

configDotenv();

export const getMailSlurp = () => {
  if (!process.env.MAILSLURP_API_KEY) {
    return;
  }
  return new MailSlurp({
    apiKey: process.env.MAILSLURP_API_KEY,
  });
};

export const ms = getMailSlurp();

export const getInbox = async () => {
  try {
    let inbox: InboxDto;
    const inboxes = await ms.getInboxes();
    if (inboxes.length === 0) {
      inbox = await ms.createInbox();
    } else {
      inbox = inboxes[0];
    }
    return inbox;
  } catch (error) {
    throw new Error(`Failed to get or create inbox: ${error.message}`);
  }
};

export const waitForLatestEmail = async (inboxId: string) => {
  try {
    return await ms.waitForLatestEmail(inboxId);
  } catch (error) {
    throw new Error(`Failed to wait for latest email: ${error.message}`);
  }
};

export const getTestEmailAccount = () => {
  const emailAddress = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  return {
    emailAddress,
    password,
  };
};

export const getAltTestEmailAccount = () => {
  const emailAddress = process.env.TEST_EMAIL_ALT;
  const password = process.env.TEST_PASSWORD;

  return {
    emailAddress,
    password,
  };
};

export const getRandomPassword = async (page: Page, len = 16) => {
  return await page.evaluate(() => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const ranVals = new Uint8Array(len);
    crypto.getRandomValues(ranVals);
    return Array.from(ranVals, (byte) => chars[byte % chars.length]).join('');
  });
};
