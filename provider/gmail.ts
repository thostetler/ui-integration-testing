import { gmail_v1, google } from 'googleapis';
import * as fs from 'fs';
import Gmail = gmail_v1.Gmail;
import * as path from 'node:path';
import { configDotenv } from 'dotenv';

configDotenv();

const CREDENTIALS_PATH = path.join(__dirname, process.env.GOOGLE_APPLICATION_CREDENTIALS_NAME ?? 'credentials.json');
const TOKEN_PATH = path.join(__dirname, process.env.GOOGLE_APPLICATION_TOKEN_NAME ?? 'token.json');
const QUERY = 'from:ads@cfa.harvard.edu in:inbox to:me';

async function authenticate() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No stored authentication token found. Run `pnpm authenticate-gmail` to generate one.');
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8')));

  return auth;
}

export async function getLatestADSEmail(to = '') {
  let gmail: Gmail;
  try {
    const auth = await authenticate();
    gmail = google.gmail({ version: 'v1', auth });
  } catch (err) {
    console.error('Failed to authenticate:', err.message);
    return;
  }

  try {
    // Step 1: Search for the latest email from ads@cfa.harvard.edu
    const res = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 1,
      q: `from:ads@cfa.harvard.edu in:inbox to:${to.length > 0 ? to : 'me'}`,
    });

    if (!res.data.messages || res.data.messages.length === 0) {
      console.log('No emails found from ads@cfa.harvard.edu.');
      return;
    }

    const messageId = res.data.messages[0].id;

    // Step 2: Get email details
    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    // Extract email subject
    const subjectHeader = message.data.payload.headers.find((h) => h.name === 'Subject');
    const subject = subjectHeader ? subjectHeader.value : '(No Subject)';

    // Extract email body (text/plain)
    let emailBody = '';
    if (message.data.payload.parts) {
      const part = message.data.payload.parts.find((p) => p.mimeType === 'text/plain');
      if (part && part.body.data) {
        emailBody = Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
    } else if (message.data.payload.body && message.data.payload.body.data) {
      emailBody = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    }

    return { subject, body: emailBody };
  } catch (e) {
    console.error(e.message);
    console.log('You may need to refresh the token, run `pnpm authenticate-gmail`');
  }
}

async function generateToken() {
  console.log('No token found, starting authentication process...');
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error(`Missing credentials file at ${CREDENTIALS_PATH}.`);
  }

  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;

  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = auth.generateAuthUrl({
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
  });
  console.log(`Authorize this app by visiting: ${authUrl}`);
  console.log('After verifying, copy/paste the code from the URL:');

  const code: string = await new Promise((resolve) => {
    process.stdin.once('data', (data) => resolve(data.toString().trim()));
  });

  const { tokens } = await auth.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

  console.log('New token saved.');
  process.exit(0);
}

// Run the authentication flow only if executed as a script
if (require.main === module) {
  generateToken().catch((err) => {
    console.error('Authentication failed:', err.message);
    process.exit(1);
  });
}
