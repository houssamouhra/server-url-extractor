import { resolveWithCurl } from "@network/resolveWithCurl.ts";
import { validateWithPlaywright } from "@test-utils/validateWithPlaywright.ts";
import { insertRedirectionHistory } from "@db/refreshHistory.ts";
import { formatDate } from "@utils/formatDate.ts";
import { isLikelyFinal } from "@utils/urlClassifier.ts";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// Path to SQLite file
const dbPath = path.resolve("database/links.sqlite");

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

export async function refreshRedirectedUrl(linkId: string): Promise<{
  wasUpdated: boolean;
  newUrl: string;
  source: "curl" | "playwright";
}> {
  const current = await db.get(
    `SELECT redirected_url FROM validated_links WHERE id = ?`,
    linkId
  );

  if (!current) throw new Error("Link not found");

  const { redirected_url } = current;

  const { resolved, status } = await resolveWithCurl(redirected_url);

  if (!resolved || resolved === current.redirected_url) {
    return {
      wasUpdated: false,
      newUrl: current.redirected_url,
      source: "curl",
    };
  }

  // Optionally: resolve further via Playwright
  let finalUrl = resolved;
  let source: "curl" | "playwright" = "curl";

  if (!isLikelyFinal(resolved)) {
    const result = await validateWithPlaywright(
      "refresh", // dummy batchId
      linkId, // linkKey
      resolved, // url to resolve
      undefined, // browser (if needed, inject externally)
      { ids: [], validatedAt: formatDate() } // dummy ctx
    );
    console.log(
      `🔁 No update needed for ${linkId}. Still points to: ${resolved}`
    );

    if (result?.redirected_url) {
      finalUrl = result.redirected_url;
      source = "playwright";
    }
  }

  // Format timestamp
  const timestamp = formatDate();

  await insertRedirectionHistory(linkId, finalUrl, status, timestamp);

  // Optional: Update redirected_url in validated_links
  await db.run(
    `UPDATE validated_links SET redirected_url = ? WHERE id = ?`,
    finalUrl,
    linkId
  );

  return {
    wasUpdated: true,
    newUrl: finalUrl,
    source,
  };
}
