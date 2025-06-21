import { test } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";
import links from "../data/dropLinks.json";
import { saveLinksToJson } from "./helpers/exportToFile";
import fs from "fs";
import path from "path";

// prettier-ignore
const validatedLinksPath = path.resolve(__dirname, "../data/validatedLinks.json");
const execAsync = promisify(exec);

type LinkDetails = {
  original: string;
  status: number;
  redirection: string | null;
  included: true | false;
  method: "curl" | "playwright";
  error?: string;
};

const validatedLinks: {
  [batchId: string]: {
    [linkKey: string]: LinkDetails;
  };
} = fs.existsSync(validatedLinksPath)
  ? JSON.parse(fs.readFileSync(validatedLinksPath, "utf-8"))
  : {};

const ids = [
  351435, 351863, 351862, 351864, 351861, 351902, 351727, 350689, 351901,
  350106, 351535, 352029, 8580, 9073, 9966, 1599, 1600, 1647, 1648, 1650,
  473563, 472870, 474808, 474806, 540351, 928, 209, 1032, 1036, 20071, 20320,
  20326, 42176, 204398, 1420, 823086, 2294, 2427, 2441, 164308, 706288, 9161,
  3424, 401567, 630106, 671313, 824020, 79336, 3075, 2227, 6729, 123, 9667,
  20352, 2421, 26,
];

// prettier-ignore
async function resolveWithCurl(url: string): Promise<{ status: number; resolved: string | null }> {
  try {
    const curlCommand = `curl --max-time 10 -Ls -o NUL -w "%{http_code} %{url_effective}" "${url}"`;
    const { stdout } = await execAsync(curlCommand)

    const match = stdout.trim().match(/^(\d{3})\s+(.+)$/);
    if (!match) {
      console.warn(`Could not parse curl output for ${url}`);
      return { status: 0, resolved: null };
    }

    const status = parseInt(match[1]);
    const resolved = match[2].trim();

    return {
      status,
      resolved: resolved || null,
    };
  } catch (err: any) {
    console.warn(`curl threw error for ${url}: ${err.message}`);
    return { status: 0, resolved: null };
  }
}

// prettier-ignore
test.describe("URL Accessibility Test with Output", () => {
  test.setTimeout(1200000);
  test.skip(({ browserName }) => browserName !== "chromium", "Skipping test on non-chromium browsers");

  for (const [batchId, linkGroup] of Object.entries(links)) {
        // Skip test definition if already exists
    if (validatedLinks[batchId]) {
      console.log(`Skipping already validated drop batch: ${batchId}`);
      continue;
    }

   validatedLinks[batchId] = {};


    for (const [linkKey, url] of Object.entries(linkGroup)) {
      const finalUrl = url.startsWith("http") ? url : "https://" + url;

      test(`(${batchId}) ${linkKey}: ${finalUrl}`, async ({ browser }) => {
        let resolved: string | null = null;
        let status = 0;
        let method = "curl";

        // Try curl first
        console.log(`Trying curl for: ${finalUrl}`);
        const { status: curlStatus, resolved: curlResolved } =
        await resolveWithCurl(finalUrl);
        console.log(`curlResolved: ${curlResolved}, curlStatus: ${curlStatus}`);

        if (curlResolved && curlStatus < 400) {
          // success via curl
          validatedLinks[batchId][linkKey] = {
            original: finalUrl,
            status: curlStatus,
            redirection: curlResolved,
            included: ids.some((id) => curlResolved.includes(String(id))),
            method: "curl",
          };
          // Skip to Playwright
          return;
        }
        // If curl gives a hard fail status, skip Playwright
        if ([0, 403, 404, 530].includes(curlStatus)) {
          validatedLinks[batchId][linkKey] = {
            original: finalUrl,
            status: curlStatus,
            redirection: curlResolved,
            included: false,
            method: "curl",
            error: `curl gave status ${curlStatus}, skipping playwright`,
          };
          return;
        } else {
          // fallback to JS rendering if curl failed
          method = "playwright";
          try {
            await Promise.race([
              (async () => {
                const page = await browser.newPage();
                const response = await page.goto(finalUrl, {
                  waitUntil: "load",
                  timeout: 20000,
                });
                await page.waitForTimeout(500);
                resolved = page.url();
                status = response?.status() ?? 0;
                await page.close();
              })(),
              new Promise((_, reject) => setTimeout(() => 
                reject(new Error("Playwright timeout (hard limit)")), 15000)),
            ]);
          } catch (err) {
            resolved = null;
            status = 0;
          }
        }

        const included = ids.some((id) => resolved?.includes(String(id)));

        // this is the final browser-redirected URL
        validatedLinks[batchId][linkKey] = {
          original: finalUrl,
          status,
          redirection: resolved,
          included,
          method: "playwright",
          ...(resolved === null && { error: "timeout or navigation failure" }),
        };

        if (status >= 400) {
          throw new Error(
            `[${method}] failed or status ${status} for ${finalUrl}`
          );
        }
      });
    }
  }
});

// prettier-ignore
// This saves **once after all tests finish**, when Playwright closes:
test.afterAll(async () => {
  await saveLinksToJson<LinkDetails>("data/validatedLinks.json", validatedLinks);
  console.log("All results saved");
});
