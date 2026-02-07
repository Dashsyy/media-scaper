import { v4 as uuid } from "uuid";
import { getDownloadedSet } from "./downloadHistory";
import { runYtDlpAnalyze } from "./ytDlp";
import { buildTitleFromUrl } from "../utils/urls";
import { sanitizeTitle } from "../utils/title";

export type AnalyzeItemInput = {
  url: string;
  thumbnail?: string | null;
};

export type AnalyzeResultItem = {
  id: string;
  title: string;
  uploader: string | null;
  duration: number | null;
  date: string | null;
  url: string;
  thumbnail: string | null;
  downloaded: boolean;
  error?: string;
};

export type AnalyzeJob = {
  id: string;
  status: "queued" | "running" | "completed" | "failed";
  total: number;
  completed: number;
  items: AnalyzeResultItem[];
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};

const jobs = new Map<string, AnalyzeJob>();
const cleanupDelayMs = 1000 * 60 * 30;

const markUpdated = (job: AnalyzeJob) => {
  job.updatedAt = new Date().toISOString();
};

const cleanupJob = (jobId: string) => {
  setTimeout(() => {
    jobs.delete(jobId);
  }, cleanupDelayMs);
};

const runAnalyze = async (job: AnalyzeJob, items: AnalyzeItemInput[]) => {
  job.status = "running";
  markUpdated(job);

  const downloadedSet = await getDownloadedSet(items.map((item) => item.url));

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const id = `item-${index + 1}`;
    try {
      const metadata = await runYtDlpAnalyze(item.url);
      const baseTitle = metadata.title ?? buildTitleFromUrl(item.url);
      job.items.push({
        id,
        title: sanitizeTitle(baseTitle),
        uploader: metadata.uploader ?? "Facebook",
        duration: metadata.duration,
        date: metadata.uploadDate,
        url: metadata.webpageUrl ?? item.url,
        thumbnail: metadata.thumbnail ?? item.thumbnail ?? null,
        downloaded: downloadedSet.has(item.url)
      });
    } catch (error) {
      const fallbackTitle = sanitizeTitle(buildTitleFromUrl(item.url));
      job.items.push({
        id,
        title: fallbackTitle,
        uploader: "Facebook",
        duration: null,
        date: null,
        url: item.url,
        thumbnail: item.thumbnail ?? null,
        downloaded: downloadedSet.has(item.url),
        error: error instanceof Error ? error.message : "Metadata fetch failed"
      });
    }

    job.completed += 1;
    markUpdated(job);
  }

  job.status = "completed";
  markUpdated(job);
  cleanupJob(job.id);
};

export const createAnalyzeJob = (items: AnalyzeItemInput[]) => {
  const now = new Date().toISOString();
  const job: AnalyzeJob = {
    id: uuid(),
    status: "queued",
    total: items.length,
    completed: 0,
    items: [],
    error: null,
    createdAt: now,
    updatedAt: now
  };

  jobs.set(job.id, job);
  runAnalyze(job, items).catch((error) => {
    job.status = "failed";
    job.error = error instanceof Error ? error.message : "Analyze failed";
    markUpdated(job);
    cleanupJob(job.id);
  });

  return job;
};

export const getAnalyzeJob = (jobId: string) => jobs.get(jobId);
