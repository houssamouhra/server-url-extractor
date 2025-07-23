import express from "express";
import { refreshRedirectedUrl } from "@services/refreshRedirect";
import { getRedirectionHistory } from "@db/refreshHistory";

const router = express.Router();

// POST /api/refresh/:linkId
router.post("/refresh/:linkId", async (req, res) => {
  try {
    const result = await refreshRedirectedUrl(req.params.linkId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/history/:linkId
router.get("/history/:linkId", async (req, res) => {
  try {
    const rows = await getRedirectionHistory(req.params.linkId);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
