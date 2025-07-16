import { test } from "@playwright/test";
import sqlite3 from "sqlite3";
import { insertInChunks } from "../helpers/db/insertInChunks";
import { ValidatedLink } from "../helpers/db/saveValidatedLinksToDb";
import { resolveWithCurl } from "../helpers/network/resolveWithCurl";
import { isMeaningfulRedirect } from "../helpers/network/redirectAnalysis";
import { open } from "sqlite";
import path from "path";

const dbPath = path.resolve("database/links.sqlite");

const allValidatedLinksByBatch: Record<string, ValidatedLink[]> = {};
const validatedCounts: Record<string, number> = {};

const ids = [
  351435, 351863, 351862, 351864, 351861, 351902, 351727, 350689, 351901,
  350106, 351535, 352029, 8580, 9073, 9966, 1599, 1600, 1647, 1648, 1650,
  473563, 472870, 474808, 474806, 540351, 928, 209, 1032, 1036, 20071, 20320,
  20326, 42176, 204398, 1420, 823086, 2294, 2427, 2441, 164308, 706288, 9161,
  3424, 401567, 630106, 671313, 824020, 79336, 3075, 2227, 6729, 123, 9667,
  20352, 2421, 26,
];

const db = await open({ filename: dbPath, driver: sqlite3.Database });

const countRows: { batchId: string; count: number }[] = await db.all(`
  SELECT batchId, COUNT(*) as count
  FROM validated_links
  GROUP BY batchId
`);

for (const row of countRows) {
  validatedCounts[row.batchId] = row.count;
}

const rows: {
  batchId: string;
  linkKey: string;
  validatedAt: string;
  originalUrl: string;
  status: number;
  redirection: boolean;
  redirected_url: string;
  included: boolean;
}[] = await db.all(`SELECT
  d.id as linkKey,
  d.batchId,
  d.originalUrl,
  d.scrapedAt,
  v.status,
  v.redirection,
  v.redirected_url,
  v.included,
  v.method,
  v.error,
  v.validatedAt
FROM drop_links d
LEFT JOIN validated_links v
  ON d.batchId = v.batchId AND d.id = v.linkKey;`);

await db.close();

// Group by batchId
const groupedByBatch: Record<string, Record<string, string>> = {};
for (const row of rows) {
  if (!groupedByBatch[row.batchId]) {
    groupedByBatch[row.batchId] = {};
  }
  groupedByBatch[row.batchId][row.linkKey] = row.originalUrl;
}

function pushValidatedLink(batchId: string, link: ValidatedLink) {
  if (!allValidatedLinksByBatch[batchId]) {
    allValidatedLinksByBatch[batchId] = [];
  }
  allValidatedLinksByBatch[batchId].push(link);
}

const today = new Date();
const validatedAt = `${String(today.getDate()).padStart(2, "0")}-${String(
  today.getMonth() + 1
).padStart(2, "0")}-${today.getFullYear()}`;

test.describe.configure({ mode: "parallel" });

test.describe("URL Accessibility Test with Output", () => {
  test.setTimeout(1200000);

  let totalTests = 0;

  // Define tests using grouped data
  for (const [batchId, linkEntries] of Object.entries(groupedByBatch)) {
    const totalLinks = Object.keys(linkEntries).length;
    const validatedSoFar = validatedCounts[batchId] || 0;

    if (validatedSoFar >= totalLinks) {
      console.log(
        `⏭ Fully validated batch: ${batchId} (${validatedSoFar}/${totalLinks})`
      );
      continue;
    }

    for (const [linkKey, url] of Object.entries(linkEntries)) {
      if (typeof url !== "string" || !url.trim()) {
        console.warn(
          `⚠️ Skipping invalid URL for batch ${batchId}, key ${linkKey}`
        );
        continue;
      }

      const normalizedUrl = url.startsWith("http") ? url : "https://" + url;
      totalTests++;

      test(`(${batchId}) ${linkKey}: ${normalizedUrl}`, async ({ browser }) => {
        // (put your existing test body logic here — no need to change it).

        let resolved: string | null = null;
        let status = 0;
        let method = "curl";

        // Try curl first
        console.log(`Trying curl for: ${normalizedUrl}`);
        const {
          status: curlStatus,
          resolved: curlResolved,
          errorCode,
        } = await resolveWithCurl(normalizedUrl);
        console.log(`curlResolved: ${curlResolved}, curlStatus: ${curlStatus}`);

        if (curlResolved && curlStatus < 400) {
          const isServerRedirect = curlStatus >= 300 && curlStatus < 400;

          const isSoftRedirect =
            curlStatus === 200 &&
            curlResolved !== null &&
            isMeaningfulRedirect(normalizedUrl, curlResolved);

          const redirectionHappened = isServerRedirect || isSoftRedirect;

          // success via curl
          pushValidatedLink(batchId, {
            linkKey,
            original: normalizedUrl,
            status: curlStatus,
            redirection: redirectionHappened,
            redirected_url: redirectionHappened ? curlResolved : null,
            included: ids.some((id) => curlResolved.includes(String(id))),
            method: "curl",
            error:
              resolved === null ? "timeout or navigation failure" : undefined,
            validatedAt,
          });

          // Skip to Playwright
          return;
        }
        // If curl gives a hard fail status, skip Playwright
        if (
          [0, 403, 404, 429, 530].includes(curlStatus) ||
          errorCode === "ENOTFOUND"
        ) {
          const isServerRedirect = curlStatus >= 300 && curlStatus < 400;

          const isSoftRedirect =
            curlStatus === 200 &&
            curlResolved !== null &&
            isMeaningfulRedirect(normalizedUrl, curlResolved);

          const redirectionHappened = isServerRedirect || isSoftRedirect;
          const included =
            !!curlResolved &&
            ids.some((id) => curlResolved.includes(String(id)));

          pushValidatedLink(batchId, {
            linkKey,
            original: normalizedUrl,
            status: curlStatus,
            redirection: redirectionHappened,
            redirected_url: redirectionHappened ? curlResolved : null,
            included,
            method: "curl",
            error:
              errorCode === "ENOTFOUND"
                ? "DNS could not be resolved"
                : `curl gave status ${curlStatus}, skipping playwright`,
            validatedAt,
          });
          return;
        } else {
          // fallback to JS rendering if curl failed
          method = "playwright";
          try {
            await Promise.race([
              (async () => {
                const page = await browser.newPage();
                const response = await page.goto(normalizedUrl, {
                  waitUntil: "load",
                  timeout: 20000,
                });
                await page.waitForTimeout(500);
                resolved = page.url();
                status = response?.status() ?? 0;
                await page.close();
              })(),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Playwright timeout (hard limit)")),
                  15000
                )
              ),
            ]);
          } catch (err) {
            resolved = null;
            status = 0;
          }
        }

        const included = ids.some((id) => resolved?.includes(String(id)));
        // this is the final browser-redirected URL
        const isServerRedirect = status >= 300 && status < 400;

        const isSoftRedirect =
          status === 200 &&
          resolved !== null &&
          isMeaningfulRedirect(normalizedUrl, resolved);

        const redirectionHappened =
          (isServerRedirect || isSoftRedirect) &&
          ![0, 403, 404].includes(status);

        pushValidatedLink(batchId, {
          linkKey,
          original: normalizedUrl,
          status,
          redirection: redirectionHappened,
          redirected_url: redirectionHappened ? resolved : null,
          included,
          method: "Playwright",
          ...(resolved === null && { error: "timeout or navigation failure" }),
          validatedAt,
        });
        if (status >= 400) {
          throw new Error(
            `[${method}] failed or status ${status} for ${normalizedUrl}`
          );
        }
      });
    }
  }

  test.afterAll(async () => {
    for (const [batchId, links] of Object.entries(allValidatedLinksByBatch)) {
      if (links.length > 0) {
        await insertInChunks(batchId, links, 100);
        console.log(`✅ Inserted ${links.length} links for batch ${batchId}`);
      }
    }
  });
  console.log(`💡 Number of tests to define: ${totalTests}`);
});
