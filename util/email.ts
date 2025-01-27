import { InboxDto, MailSlurp } from 'mailslurp-client';
import { configDotenv } from 'dotenv';

configDotenv();
const ms = new MailSlurp({
  apiKey: process.env.MAILSLURP_API_KEY,
});

export const getMailSlurp = () => {
  if (!process.env.MAILSLURP_API_KEY) {
    throw new Error('Environment variable MAILSLURP_API_KEY must be defined');
  }
  return ms;
}

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
}

export const waitForLatestEmail = async (inboxId: string) => {
  try {
    return await ms.waitForLatestEmail(inboxId);
  } catch (error) {
    throw new Error(`Failed to wait for latest email: ${error.message}`);
  }
}

export const getTestEmailAccount = () => {
  const emailAddress = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!emailAddress || !password) {
    throw new Error('Environment variables TEST_EMAIL and TEST_PASSWORD must be defined');
  }

  return {
    emailAddress,
    password
  }
}
