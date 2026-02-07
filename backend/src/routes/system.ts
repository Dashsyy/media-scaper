import { Router } from "express";
import { revealPath } from "../utils/system";

const router = Router();

router.post("/reveal", (req, res) => {
  const body = req.body as { path?: unknown };
  if (typeof body.path !== "string" || body.path.trim().length === 0) {
    res.status(400).json({ error: "Path required" });
    return;
  }

  try {
    revealPath(body.path);
    res.json({ status: "ok" });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Reveal failed" });
  }
});

export default router;
