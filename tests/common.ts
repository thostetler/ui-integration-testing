import type { TestInfo } from '@playwright/test';

export const isScix = (testInfo: TestInfo) => {
  // for now just check if the test file is in the scix folder,
  // this is not a perfect solution, but it works for now
  return testInfo.file.includes('tests/scix');
};
