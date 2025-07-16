import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { formatDate } from "../../helpers/utils/formatDate";

import path from "path";

// Path to SQLite file
const dbPath = path.resolve("database/links.sqlite");

export async function insertIntoDropLinks(batchId: string, urls: string[]) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("BEGIN TRANSACTION");

  try {
    // prepared statement (to execute compiled SQL command once and reuse it for each URL)
    const stmt = await db.prepare(
      `INSERT OR IGNORE INTO drop_links (batchId, originalUrl, scrapedAt) VALUES (?, ?, ?)`
    );

    for (const url of urls) {
      // dynamic per-insert timestamp
      const scrapedAt = formatDate();
      await stmt.run(batchId, url, scrapedAt);
    }

    await stmt.finalize();

    await db.exec("COMMIT");
    console.log(`✅ Inserted ${urls.length} drop links for batch ${batchId}`);
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  } finally {
    await db.close();
  }
}
