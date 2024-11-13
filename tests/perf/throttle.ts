import { BrowserContext, Page } from '@playwright/test';

type ThrottleSettings = Record<
  string,
  {
    rate: number;
    networkConditions?: {
      offline: boolean;
      latency: number;
      downloadThroughput: number;
      uploadThroughput: number;
      connectionType: 'cellular3g' | 'ethernet';
    };
  }
>;

const throttleSettings: ThrottleSettings = {
  '6x': {
    rate: 6,
  },
  '3g-4x': {
    rate: 4,
    networkConditions: {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: 'cellular3g',
    },
  },
  'eth-2x': {
    rate: 2,
    networkConditions: {
      offline: false,
      latency: 0,
      downloadThroughput: -1,
      uploadThroughput: -1,
      connectionType: 'ethernet',
    },
  },
};

export const throttlePage = async (context: BrowserContext, page: Page, tag: keyof typeof throttleSettings) => {
  const cdpSession = await context.newCDPSession(page);

  const settings = throttleSettings[tag];
  await cdpSession.send('Emulation.setCPUThrottlingRate', {
    rate: settings.rate,
  });
  if (settings.networkConditions) {
    await cdpSession.send('Network.emulateNetworkConditions', settings.networkConditions);
  }
  return settings;
};
