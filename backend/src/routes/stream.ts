import { Router } from "express";
import { getJob, subscribeToJob } from "../services/jobStore";

const router = Router();

router.get("/:id/stream", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ jobId: job.id })}\n\n`);
  res.write(
    `event: snapshot\ndata: ${JSON.stringify({
      jobId: job.id,
      status: job.status,
      items: job.items
    })}\n\n`
  );

  const unsubscribe = subscribeToJob(
    job.id,
    (payload) => {
      res.write(`event: progress\ndata: ${JSON.stringify(payload)}\n\n`);
    },
    (payload) => {
      res.write(`event: done\ndata: ${JSON.stringify(payload)}\n\n`);
    }
  );

  req.on("close", () => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
});

export default router;
