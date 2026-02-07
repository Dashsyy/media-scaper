import { Router } from "express";
import { listDownloaded } from "../services/downloadHistory";

const router = Router();

router.get("/", (req, res) => {
  const limitParam = req.query.limit;
  const limit = typeof limitParam === "string" ? Number(limitParam) : 20;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20;
  const items = listDownloaded(safeLimit);

  res.json({ items });
});

export default router;
