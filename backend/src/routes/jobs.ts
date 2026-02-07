import { Router } from "express";
import { getDownloadedSet } from "../services/downloadHistory";
import { cancelJob, createJob, getJob, retryFailed } from "../services/jobStore";

const router = Router();

router.post("/", async (req, res) => {
  const body = req.body as {
    urls?: unknown;
    items?: unknown;
    outputDir?: unknown;
  };
  const urls = Array.isArray(body.urls) ? body.urls.filter((url) => typeof url === "string") : [];
  const items = Array.isArray(body.items)
    ? body.items.flatMap((entry) => {
        if (!entry || typeof entry !== "object") {
          return [];
        }
        const item = entry as { url?: string; title?: string; thumbnail?: string | null };
        if (!item.url) {
          return [];
        }
        return [
          {
            url: item.url,
            title: item.title,
            thumbnail: item.thumbnail ?? null
          }
        ];
      })
    : [];

  const combined = items.length > 0 ? items : urls.map((url) => ({ url }));

  if (combined.length === 0) {
    res.status(400).json({ error: "No URLs provided" });
    return;
  }

  try {
    const downloadedSet = await getDownloadedSet(combined.map((entry) => entry.url));
    const pendingItems = combined.filter((entry) => !downloadedSet.has(entry.url));

    if (pendingItems.length === 0) {
      res.status(409).json({ error: "All URLs already downloaded" });
      return;
    }

    const outputDir = typeof body.outputDir === "string" ? body.outputDir : undefined;
    const job = createJob(pendingItems, outputDir);

    res.status(201).json({
      jobId: job.id,
      status: job.status,
      items: job.items
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Job failed" });
  }
});

router.get("/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({
    jobId: job.id,
    status: job.status,
    items: job.items
  });
});

router.post("/:id/cancel", (req, res) => {
  const job = cancelJob(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ jobId: job.id, status: job.status });
});

router.post("/:id/retry", (req, res) => {
  const job = retryFailed(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ jobId: job.id, status: job.status, items: job.items });
});

export default router;
