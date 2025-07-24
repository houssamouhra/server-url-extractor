import { test } from "@playwright/test";
import sqlite3 from "sqlite3";
import { insertInChunks } from "@db/insertInChunks";
import type { ValidatedLink } from "@db/saveValidatedLinksToDb";
import { formatDate } from "@utils/formatDate";
import type { ValidationContext } from "@helpers/test-utils";
import { loadDropLinkData } from "@helpers/db/loadDropLinks";
import { loadValidatedCounts } from "@helpers/db/loadValidatedCounts";

import {
  prepareTestCases,
  runValidation,
  pushValidatedLink,
} from "@helpers/test-utils";

import { open } from "sqlite";
import path from "path";

const dbPath = path.resolve("database/links.sqlite");
const db = await open({ filename: dbPath, driver: sqlite3.Database });

const ids = [
  351435, 351863, 351862, 351864, 351861, 351902, 351727, 350689, 351901,
  350106, 351535, 352029, 8580, 9073, 9966, 1599, 1600, 1647, 1648, 1650,
  473563, 472870, 474808, 474806, 540351, 928, 209, 1032, 1036, 20071, 20320,
  20326, 42176, 204398, 1420, 823086, 2294, 2427, 2441, 164308, 706288, 9161,
  3424, 401567, 630106, 671313, 824020, 79336, 3075, 2227, 6729, 123, 9667,
  20352, 2421, 26,
];

const validatedCounts = await loadValidatedCounts(db);
const rows = await loadDropLinkData(db);

await db.close();

// Group by batchId
const groupedByBatch: Record<string, Record<string, string>> = {};
for (const row of rows) {
  if (!groupedByBatch[row.batchId]) {
    groupedByBatch[row.batchId] = {};
  }
  groupedByBatch[row.batchId][row.linkKey] = row.originalUrl;
}

const validatedAt = formatDate();

const testCases = prepareTestCases(groupedByBatch, validatedCounts);
const allValidatedLinksByBatch: Record<string, ValidatedLink[]> = {};
const context: ValidationContext = {
  ids,
  validatedAt,
};

const skippedBatches = Object.entries(validatedCounts).filter(
  ([batchId, count]) =>
    groupedByBatch[batchId] &&
    count >= Object.keys(groupedByBatch[batchId]).length
).length;

console.log(`🔕 Skipped batches: ${skippedBatches}`);

test.describe.configure({ mode: "parallel" });

test.describe("URL Accessibility Test with Output", () => {
  test.setTimeout(1200000);
  let totalInserted = 0;
  console.log(`💡 Number of tests to define: ${testCases.length}`);

  // Define tests using grouped data
  for (const { batchId, linkKey, normalizedUrl } of testCases) {
    test(`(${batchId}) ${linkKey}: ${normalizedUrl}`, async ({ browser }) => {
      console.log(`🧪 Running: (${batchId}) ${linkKey}`);

      const result = await runValidation(
        batchId,
        linkKey,
        normalizedUrl,
        browser,
        context
      );

      pushValidatedLink(allValidatedLinksByBatch, batchId, result);

      if (result.status >= 400) {
        console.error(
          `❌ ${result.method} failed [${result.status}] for ${normalizedUrl}`
        );
        throw new Error(
          `[${result.method}] failed or status ${result.status} for ${normalizedUrl}`
        );
      } else {
        console.log(
          `✅ ${result.method} success [${result.status}] for ${normalizedUrl}`
        );
      }
    });
  }

  test.afterAll(async () => {
    for (const [batchId, links] of Object.entries(allValidatedLinksByBatch)) {
      if (links.length > 0) {
        await insertInChunks(batchId, links, 100);
        console.log(`📦 Batch ${batchId}: ${links.length} links inserted`);
        totalInserted += links.length;
      }
    }
    console.log(`🧾 Total links inserted: ${totalInserted}`);
  });
});
