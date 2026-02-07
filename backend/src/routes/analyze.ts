import { Router } from "express";
import { createAnalyzeJob, getAnalyzeJob } from "../services/analyzeStore";
import { parseInputItems } from "../utils/urls";

const router = Router();

router.post("/", (req, res) => {
  const items = parseInputItems(req.body);
  if (items.length === 0) {
    res.status(400).json({ error: "No URLs provided" });
    return;
  }

  const job = createAnalyzeJob(items);
  res.status(202).json({ jobId: job.id });
});

router.get("/:id", (req, res) => {
  const job = getAnalyzeJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Analyze job not found" });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    total: job.total,
    completed: job.completed,
    items: job.items,
    error: job.error ?? undefined
  });
});

export default router;
