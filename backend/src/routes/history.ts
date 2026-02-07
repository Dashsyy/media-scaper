import { Router } from "express";
import { listDownloaded } from "../services/downloadHistory";

const router = Router();

router.get("/", async (req, res) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === "string" ? Number(limitParam) : 20;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;

  try {
    const items = await listDownloaded(safeLimit);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "History load failed" });
  }
});

export default router;
