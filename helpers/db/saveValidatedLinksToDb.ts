import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { formatDate } from "../../helpers/utils/formatDate";
import path from "path";

// Path to SQLite file
const dbPath = path.resolve("database/links.sqlite");

export type ValidatedLink = {
  linkKey: string;
  original: string;
  status: number;
  redirection: boolean;
  redirected_url: string | null;
  included: boolean;
  method: string;
  error?: string;
  validatedAt: string;
};

export async function insertIntoValidatedLinks(
  batchId: string,
  links: ValidatedLink[]
) {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("BEGIN TRANSACTION");

  try {
    const stmt = await db.prepare(
      `INSERT INTO validated_links (
        batchId,
        linkKey,
        validatedAt,
        original,
        status,
        redirection,
        redirected_url,
        included,
        method,
        error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const link of links) {
      // dynamic per-insert timestamp
      const validatedAt = formatDate();

      await stmt.run(
        batchId,
        link.linkKey,
        validatedAt,
        link.original,
        link.status,
        link.redirection ? 1 : 0,
        link.redirected_url,
        link.included ? 1 : 0,
        link.method,
        link.error || null
      );
    }

    await stmt.finalize();
    await db.exec("COMMIT");
    // prettier-ignore
    console.log(`✅ Inserted ${links.length} validated links for batch ${batchId}`);
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  } finally {
    await db.close();
  }
}
