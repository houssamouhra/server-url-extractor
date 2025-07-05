// backend/server.js
import express from "express";
import cors from "cors";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());

// prettier-ignore
app.get("/api/validated-links", async (req, res) => {
  const filePath = path.join(__dirname, "../data/validatedLinks.json");

  try {
    await fs.access(filePath);

    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    const flatLinks = [];

    for (const [batchId, { links, date }] of Object.entries(parsed)) {
      for (const [linkKey, linkData] of Object.entries(links)) {
        flatLinks.push({
          batchId,
          linkKey,
          date,
          ...linkData,
        });
      }
    }

    res.json(flatLinks);
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.status(404).json({ error: "validatedLinks.json not found" });
    }
    return res.status(500).json({ error: "Failed to parse validatedLinks.json" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
