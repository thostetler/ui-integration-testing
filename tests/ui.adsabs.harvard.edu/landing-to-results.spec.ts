import { test } from "../../test-base";

test("first author search", async ({ page, performance }) => {
  await page.goto("https://devui.adsabs.harvard.edu/");
  await page
    .getByLabel("Start typing a query here to")
    .fill('author:"^Solanki, Sami"');
  performance.sampleStart("LTR-first-author");
  await page.getByLabel("submit").click();
  await page.waitForSelector("h3.s-results-title");
  performance.sampleEnd("LTR-first-author");
});
