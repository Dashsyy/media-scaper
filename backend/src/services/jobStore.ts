import { EventEmitter } from "events";
import { spawn } from "child_process";
import path from "path";
import { v4 as uuid } from "uuid";
import { runYtDlpDownload } from "./ytDlp";
import { markDownloaded } from "./downloadHistory";
import { buildTitleFromUrl } from "../utils/urls";

export type JobItem = {
  id: string;
  url: string;
  title: string;
  thumbnail?: string | null;
  filePath?: string | null;
  status: "queued" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  error?: string | null;
};

export type Job = {
  id: string;
  outputDir?: string;
  status: "running" | "completed" | "failed" | "cancelled";
  items: JobItem[];
  emitter: EventEmitter;
  currentProcesses?: Set<ReturnType<typeof spawn>>;
  cancelled?: boolean;
  active?: boolean;
};

const jobs = new Map<string, Job>();

const emitItemUpdate = (job: Job, item: JobItem) => {
  job.emitter.emit("update", { jobId: job.id, item: { ...item } });
};

const finishJob = (job: Job) => {
  if (job.cancelled) {
    job.status = "cancelled";
    job.emitter.emit("done", { jobId: job.id, status: job.status });
    return;
  }

  const hasFailure = job.items.some((item) => item.status === "failed");
  job.status = hasFailure ? "failed" : "completed";
  job.emitter.emit("done", { jobId: job.id, status: job.status });
};

const runDownloads = async (job: Job, outputDir: string, onlyFailed = false) => {
  job.active = true;
  const concurrency = Math.max(1, Number(process.env.DOWNLOAD_CONCURRENCY ?? 1));
  const queue = job.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (onlyFailed) {
        return item.status === "failed";
      }
      return item.status !== "completed";
    });
  let cursor = 0;

  const takeNext = () => {
    if (cursor >= queue.length) {
      return null;
    }
    const entry = queue[cursor];
    cursor += 1;
    return entry.item;
  };

  const worker = async () => {
    while (true) {
      if (job.cancelled) {
        return;
      }

      const item = takeNext();
      if (!item) {
        return;
      }

      if (job.cancelled) {
        item.status = item.status === "completed" ? "completed" : "cancelled";
        emitItemUpdate(job, item);
        continue;
      }

      item.status = "downloading";
      item.error = null;
      emitItemUpdate(job, item);

      try {
        const result = await runYtDlpDownload({
          url: item.url,
          outputDir,
          onProgress: (progress) => {
            item.progress = Math.max(item.progress, Math.floor(progress));
            emitItemUpdate(job, item);
          },
          onLog: (line) => {
            if (line.includes("ERROR")) {
              item.error = line;
            }
          },
          onFilePath: (filePath) => {
            item.filePath = filePath;
          },
          onProcess: (process) => {
            job.currentProcesses?.add(process);
            process.on("close", () => {
              job.currentProcesses?.delete(process);
            });
          }
        });

        item.progress = 100;
        item.status = "completed";
        item.filePath = item.filePath ?? result.filePath ?? null;
        await markDownloaded(item.url, item.title, item.filePath, item.thumbnail ?? null);
        emitItemUpdate(job, item);
      } catch (error) {
        item.status = job.cancelled ? "cancelled" : "failed";
        item.error = error instanceof Error ? error.message : "Download failed";
        emitItemUpdate(job, item);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

  job.active = false;
  if (job.cancelled) {
    job.items.forEach((item) => {
      if (item.status !== "completed" && item.status !== "cancelled") {
        item.status = "cancelled";
        emitItemUpdate(job, item);
      }
    });
  }
  finishJob(job);
};

export const createJob = (
  itemsInput: Array<{ url: string; title?: string; thumbnail?: string | null }>,
  outputDir?: string
) => {
  const items: JobItem[] = itemsInput.map((item) => ({
    id: uuid(),
    url: item.url,
    title: item.title ?? buildTitleFromUrl(item.url),
    thumbnail: item.thumbnail ?? null,
    status: "queued",
    progress: 0,
    error: null
  }));

  const job: Job = {
    id: uuid(),
    outputDir,
    status: "running",
    items,
    emitter: new EventEmitter(),
    currentProcesses: new Set(),
    cancelled: false,
    active: false
  };

  jobs.set(job.id, job);

  const resolvedOutput =
    outputDir ??
    process.env.DEFAULT_OUTPUT_DIR ??
    path.resolve(process.cwd(), "..", "downloads");
  runDownloads(job, resolvedOutput).catch(() => {
    job.status = "failed";
    finishJob(job);
  });

  return job;
};

export const cancelJob = (jobId: string) => {
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }

  job.cancelled = true;
  job.currentProcesses?.forEach((process) => {
    process.kill("SIGTERM");
  });
  return job;
};

export const retryFailed = (jobId: string) => {
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }

  if (job.active) {
    return job;
  }

  job.status = "running";
  job.cancelled = false;
  const outputDir = job.outputDir ?? "./downloads";
  runDownloads(job, outputDir, true).catch(() => {
    job.status = "failed";
    finishJob(job);
  });

  return job;
};

export const getJob = (jobId: string) => jobs.get(jobId);

export const subscribeToJob = (
  jobId: string,
  onUpdate: (payload: { jobId: string; item: JobItem }) => void,
  onDone: (payload: { jobId: string }) => void
) => {
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }

  job.emitter.on("update", onUpdate);
  job.emitter.on("done", onDone);

  return () => {
    job.emitter.off("update", onUpdate);
    job.emitter.off("done", onDone);
  };
};
