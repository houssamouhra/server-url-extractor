// backend/server.js
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import refreshRoutes from "./routes/refresh.ts";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Path to the SQLite file
const dbPath = path.join(__dirname, "../database/links.sqlite");
const db = new Database(dbPath);

app.use(cors());

app.get("/api/validated-links", (req, res) => {
  try {
    const rows = db
      .prepare(
        `
    SELECT
      v.batchId,
      v.linkKey,
      v.validatedAt AS date,
      v.original,
      v.status,
      v.redirection,
      v.redirected_url,
      v.included,
      v.method,
      v.error
    FROM validated_links v
    WHERE v.status IS NOT NULL
    ORDER BY v.batchId DESC
    `
      )
      .all();

    res.json(rows);
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: "Failed to fetch data from database" });
  }
});

app.use("/api", refreshRoutes);

app.listen(PORT, () => {
  console.log(`✅ API running at http://localhost:${PORT}`);
});
