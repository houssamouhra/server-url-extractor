import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

// Path to SQLite file
const dbPath = path.resolve("database/links.sqlite");

const db = await open({
  filename: dbPath,
  driver: sqlite3.Database,
});

export async function insertRedirectionHistory(
  linkId: string,
  redirectedUrl: string,
  statusCode: number,
  timestamp: string
) {
  await db.run(
    `INSERT INTO url_redirection_history 
     (validated_link_id, redirected_url, status_code, timestamp)
     VALUES (?, ?, ?, ?)`,
    linkId,
    redirectedUrl,
    statusCode,
    timestamp
  );
}

export async function getRedirectionHistory(linkId: string) {
  return db.all(
    `SELECT redirected_url, status_code, timestamp
     FROM url_redirection_history
     WHERE validated_link_id = ?
     ORDER BY timestamp DESC`,
    linkId
  );
}
