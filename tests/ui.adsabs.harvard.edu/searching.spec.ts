import { test, TestContext } from "../../test-base";
import { queries } from "../../queries";
import { throttlePage } from "../../throttle";

test.use({
  baseURL: "https://devui.adsabs.harvard.edu",
  trace: "on-first-retry",
});

type Query = (typeof queries)[number];

const perfTest = async (
  prefix: string,
  { page, performance }: Pick<TestContext, "page" | "performance">,
  { query, name }: Query,
) => {
  performance.sampleStart(`${prefix}.landing.pre-load.${name}`);
  await page.goto("/", { waitUntil: "commit" });
  await page.fill('input[name="q"]', query);
  performance.sampleStart(`${prefix}.landing.post-load.${name}`);
  await page.getByLabel("submit").click();
  await page.waitForSelector("h3.s-results-title");
  performance.sampleEnd(`${prefix}.landing.pre-load.${name}`);
  performance.sampleEnd(`${prefix}.landing.post-load.${name}`);
};

for (const { description, name, query } of queries) {
  test(description, async ({ page, performance }) => {
    await perfTest(
      "bbb.normal",
      { page, performance },
      { query, name, description },
    );
  });
}

for (const { description, name, query } of queries) {
  test(
    description,
    {
      tag: ["@throttled", "@3g-4x"],
    },
    async ({ page, performance, context }) => {
      test.slow();

      await throttlePage(context, page, "3g-4x");
      await perfTest(
        "bbb.3g-4x.",
        { page, performance },
        { query, name, description },
      );
    },
  );
}

for (const { description, name, query } of queries) {
  test(
    description,
    {
      tag: ["@throttled", "@eth-2x"],
    },
    async ({ page, performance, context }) => {
      test.slow();

      await throttlePage(context, page, "eth-2x");
      await perfTest(
        "bbb.eth-2x.",
        { page, performance },
        { query, name, description },
      );
    },
  );
}
