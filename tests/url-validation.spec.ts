import { test } from "@playwright/test";
import { exec } from "child_process";
import { promisify } from "util";
import links from "../data/dropLinks.json";
import { saveLinksToJson } from "../helpers/exportToFile";
import fs from "fs";
import path from "path";

// prettier-ignore
const validatedLinksPath = path.resolve(__dirname, "../data/validatedLinks.json");
const execAsync = promisify(exec);

type LinkDetails = {
  original: string;
  status: number;
  redirection: boolean;
  redirected_url: string | null;
  included: true | false;
  method: "curl" | "playwright";
  error?: string;
};

type DropLinkGroup =
  | { links: { [key: string]: string }; date: string }
  | { [key: string]: string };

const typedLinks: { [batchId: string]: DropLinkGroup } = links;

const validatedLinks: {
  [batchId: string]: {
    links: { [linkKey: string]: LinkDetails };
    date: string;
  };
} = fs.existsSync(validatedLinksPath)
  ? JSON.parse(fs.readFileSync(validatedLinksPath, "utf-8"))
  : {};

const testResults: typeof validatedLinks = {};

const ids = [
  351435, 351863, 351862, 351864, 351861, 351902, 351727, 350689, 351901,
  350106, 351535, 352029, 8580, 9073, 9966, 1599, 1600, 1647, 1648, 1650,
  473563, 472870, 474808, 474806, 540351, 928, 209, 1032, 1036, 20071, 20320,
  20326, 42176, 204398, 1420, 823086, 2294, 2427, 2441, 164308, 706288, 9161,
  3424, 401567, 630106, 671313, 824020, 79336, 3075, 2227, 6729, 123, 9667,
  20352, 2421, 26,
];

// prettier-ignore
async function resolveWithCurl(url: string): Promise<{ status: number; resolved: string | null; errorCode?: string}> {
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
    return { status: 0, resolved: null, errorCode: err.code || "UNKNOWN"};
  }
}

console.log("Validated links loaded:", Object.keys(validatedLinks).length);

// prettier-ignore
test.describe.configure({ mode: "parallel" });
test.describe("URL Accessibility Test with Output", () => {
  test.setTimeout(1200000);

  let totalTests = 0;
  // prettier-ignore
  for (const [batchId, dataGroup] of Object.entries(typedLinks)) {
    // Skip test definition if already exists
    const allLinkKeys = Object.keys(
      "links" in dataGroup
        ? dataGroup.links
        : (dataGroup as { [key: string]: string })
    );

    const alreadyValidatedCount = allLinkKeys.filter(
      (key) => validatedLinks[batchId]?.links?.[key]
    ).length;

    if (alreadyValidatedCount === allLinkKeys.length) {
      console.log(`⏭ Fully validated batch: ${batchId}`);
      continue;
    }

    totalTests += allLinkKeys.length;

    const linkEntries =
      "links" in dataGroup && typeof dataGroup.links === "object"
        ? dataGroup.links
        : (dataGroup as { [key: string]: string });

    for (const [linkKey, url] of Object.entries(linkEntries)) {
      const finalUrl = url.startsWith("http") ? url : "https://" + url;

      test(`(${batchId}) ${linkKey}: ${finalUrl}`, async ({ browser }) => {
        let resolved: string | null = null;
        let status = 0;
        let method = "curl";
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2,"0")}-${String(now.getMonth() + 1).padStart(2,"0")}-${now.getFullYear()} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        function ensureBatchLinks(batchId: string) {
          if (!testResults[batchId]) {
            testResults[batchId] = {
              links: {},
              date: formattedDate,
            };
          } else if (!testResults[batchId].links) {
            testResults[batchId].links = {};
          }
        }

        ensureBatchLinks(batchId);

        // makes sure only real redirections are flagged, not cosmetic ones.
        const normalizeUrl = (rawurl: string | null): string | null => {
          if (!rawurl) return null;

          try {
            const url = new URL(rawurl.trim());

            // Remove 'www.' if present
            const hostname = url.hostname.replace(/^www\./, "");

            // Normalize path (remove trailing slash unless it's root)
            const path =
              url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
            const search = url.search;

            return `${url.protocol}//${hostname}${path}${search}`;
          } catch {
            return rawurl.trim().replace(/\/+$/, "").toLowerCase(); // fallback
          }
        };

        // Try curl first
        console.log(`Trying curl for: ${finalUrl}`);
        const { status: curlStatus, resolved: curlResolved, errorCode } = await resolveWithCurl(finalUrl);
        console.log(`curlResolved: ${curlResolved}, curlStatus: ${curlStatus}`);

        if (curlResolved && curlStatus < 400) {
          const redirectionHappened =
            curlResolved !== null &&
            normalizeUrl(curlResolved) !== normalizeUrl(finalUrl);
          // success via curl
          testResults[batchId].links[linkKey] = {
            original: finalUrl,
            status: curlStatus,
            redirection: redirectionHappened,
            redirected_url: redirectionHappened ? curlResolved : null,
            included: ids.some((id) => curlResolved.includes(String(id))),
            method: "curl",
          };
          // Skip to Playwright
          return;
        }
        // If curl gives a hard fail status, skip Playwright
        if ([0, 403, 404, 429, 530].includes(curlStatus) || errorCode === "ENOTFOUND") {
          const redirectionHappened = normalizeUrl(curlResolved) !== normalizeUrl(finalUrl);

          testResults[batchId].links[linkKey] = {
            original: finalUrl,
            status: curlStatus,
            redirection: redirectionHappened,
            redirected_url: redirectionHappened ? curlResolved : null,
            included: false,
            method: "curl",
            error: errorCode === "ENOTFOUND" ? "DNS could not be resolved" : `curl gave status ${curlStatus}, skipping playwright`,
          };
          return;
        } else {
          // fallback to JS rendering if curl failed
          method = "playwright";
          try {
            await Promise.race([(async () => {
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
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Playwright timeout (hard limit)")),15000)
              ),
            ]);
          } catch (err) {
            resolved = null;
            status = 0;
          }
        }

        const included = ids.some((id) => resolved?.includes(String(id)));
        // this is the final browser-redirected URL
        const redirectionHappened =
          resolved !== null &&
          normalizeUrl(resolved) !== normalizeUrl(finalUrl);
        testResults[batchId].links[linkKey] = {
          original: finalUrl,
          status,
          redirection: redirectionHappened,
          redirected_url: redirectionHappened ? resolved : null,
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
  console.log(`💡 Number of tests to define: ${totalTests}`);
});

// prettier-ignore
// This saves **once after all tests finish**, when Playwright closes:
test.afterAll(async () => {
  const formatted: {
    [batchId: string]: {
      links: { [key: string]: LinkDetails };
      date: string;
    };
  } = {};

  const merged = { ...validatedLinks };

  for (const [batchId, { links, date }] of Object.entries(testResults)) {
    if (!merged[batchId]) {
      merged[batchId] = { links: {}, date };
    }

    Object.assign(merged[batchId].links, links);
    formatted[batchId] = {
      links: Object.fromEntries(
        Object.entries(links).sort(([a], [b]) => {
          const aNum = parseInt(a.replace("link", ""));
          const bNum = parseInt(b.replace("link", ""));
          return aNum - bNum;
        })
      ),
      date,
    };
  }
  await saveLinksToJson<LinkDetails>("data/validatedLinks.json", merged);
  console.log("✅ All validated links exported with proper format.");
});
