import type { TestCase } from "@helpers/test-utils";

export function prepareTestCases(
  groupedByBatch: Record<string, Record<string, string>>,
  validatedCounts: Record<string, number>
): TestCase[] {
  const testCases = [];

  for (const [batchId, linkEntries] of Object.entries(groupedByBatch)) {
    const totalLinks = Object.keys(linkEntries).length;
    const validatedSoFar = validatedCounts[batchId] || 0;

    if (validatedSoFar >= totalLinks) {
      console.log(
        `⏭ Skipping batch ${batchId} (${validatedSoFar}/${totalLinks})`
      );
      continue;
    }

    for (const [linkKey, url] of Object.entries(linkEntries)) {
      if (typeof url !== "string" || !url.trim()) continue;

      const normalizedUrl = url.startsWith("http") ? url : "https://" + url;

      testCases.push({ batchId, linkKey, normalizedUrl });
    }
  }

  return testCases;
}
