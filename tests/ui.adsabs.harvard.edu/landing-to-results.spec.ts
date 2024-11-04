import { queries } from "../../queries";
import { test } from "../../test-base";

const url = "https://devui.adsabs.harvard.edu/";
for (const { description, name, query } of queries) {
  test(description, async ({ page, performance }) => {
    await page.goto(url);
    await page.getByLabel("Start typing a query here to").fill(query);
    performance.sampleStart(`LTR-${name}`);
    await page.getByLabel("submit").click();
    await page.waitForSelector("h3.s-results-title");
    performance.sampleEnd(`LTR-${name}`);
  });
}
