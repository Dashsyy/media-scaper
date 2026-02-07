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
  currentProcess?: ReturnType<typeof spawn> | null;
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
  for (const item of job.items) {
    if (job.cancelled) {
      item.status = item.status === "completed" ? "completed" : "cancelled";
      emitItemUpdate(job, item);
      continue;
    }

    if (onlyFailed && item.status !== "failed") {
      continue;
    }

    if (item.status === "completed") {
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
          job.currentProcess = process;
        }
      });

      item.progress = 100;
      item.status = "completed";
      item.filePath = item.filePath ?? result.filePath ?? null;
      markDownloaded(item.url, item.title, item.filePath, item.thumbnail ?? null);
      emitItemUpdate(job, item);
    } catch (error) {
      item.status = job.cancelled ? "cancelled" : "failed";
      item.error = error instanceof Error ? error.message : "Download failed";
      emitItemUpdate(job, item);
    }

    job.currentProcess = null;
  }

  job.active = false;
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
  if (job.currentProcess) {
    job.currentProcess.kill("SIGTERM");
  }
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
