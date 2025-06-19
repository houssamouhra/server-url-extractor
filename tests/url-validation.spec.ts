import { test } from "@playwright/test";
import links from "../dropLinks.json";
import { saveLinksToJson } from "./helpers/exportToFile";

type LinkDetails = {
  original: string;
  status: number;
  redirection: string | null;
};

const validatedLinks: {
  [batchId: string]: {
    [linkKey: string]: LinkDetails;
  };
} = {};

//prettier-ignore
test.describe("URL Accessibility Test with Output", () => {
  test.setTimeout(1200000);
  test.skip(({ browserName }) => browserName !== "chromium","Skipping test on non-chromium browsers");
  for (const [batchId, linkGroup] of Object.entries(links)) {
    test.describe.serial(`${batchId} validation`, () => {
      console.log("linkGroup:", linkGroup);

      if (!validatedLinks[batchId]) {
        validatedLinks[batchId] = {};
      }

      for (const [linkKey, url] of Object.entries(linkGroup)) {
        const finalUrl = url.startsWith("http") ? url : "https://" + url;

        test(`Check ${linkKey}: ${finalUrl}`, async ({ browser }) => {
          try {
            const page = await browser.newPage();
            const response = await page.goto(finalUrl, {
              waitUntil: "load",
              timeout: 20000,
            });

            await page.waitForTimeout(500);

            const status = response?.status() ?? 0;
            // this is the final browser-redirected URL
            const resolvedUrl = page.url();

            await page.close();

            validatedLinks[batchId][linkKey] = {
              original: url,
              status,
              redirection: resolvedUrl || null,
            };

            if (status >= 400) {
              throw new Error(`Status code ${status} >= 400 for ${finalUrl}`);
            }

            // Assert status < 400 - this will fail test if status >= 400
          } catch (error: any) {
            console.warn(`❌ Request failed for ${finalUrl}: ${error.message}`);

            // Save error info in the output object
            validatedLinks[batchId][linkKey] = {
              original: url,
              status: 0,
              redirection: null,
            };

            // Instead of expect(error).toBeUndefined(), throw here to mark test failed but after saving
            throw new Error(`Request failed for ${finalUrl}: ${error.message}`);
          }
        });
      }
    });
  }
});

// ✅ This saves **once after all tests finish**, when Playwright closes:
test.afterAll(async () => {
  await saveLinksToJson<LinkDetails>("validatedLinks.json", validatedLinks);
  console.log("✅ All results saved to validatedLinks.json");
});
