import { sqlite } from "../db/client";

type DownloadedRow = {
  url: string;
};

export const getDownloadedSet = (urls: string[]) => {
  if (urls.length === 0) {
    return new Set<string>();
  }

  const placeholders = urls.map(() => "?").join(",");
  const stmt = sqlite.prepare(
    `SELECT url FROM downloaded_videos WHERE url IN (${placeholders})`
  );
  const rows = stmt.all(...urls) as DownloadedRow[];
  return new Set(rows.map((row) => row.url));
};

export const markDownloaded = (
  url: string,
  title?: string,
  filePath?: string | null,
  thumbnail?: string | null
) => {
  const stmt = sqlite.prepare(
    `INSERT OR REPLACE INTO downloaded_videos (url, title, downloaded_at)
     VALUES (?, ?, ?)`
  );
  const now = new Date().toISOString();
  stmt.run(url, title ?? null, now);

  const update = sqlite.prepare(
    `UPDATE downloaded_videos
     SET file_path = ?, thumbnail = ?
     WHERE url = ?`
  );
  update.run(filePath ?? null, thumbnail ?? null, url);
};

export const listDownloaded = (limit = 20) => {
  const stmt = sqlite.prepare(
    `SELECT url, title, thumbnail, file_path as filePath, downloaded_at as downloadedAt
     FROM downloaded_videos
     ORDER BY downloaded_at DESC
     LIMIT ?`
  );
  return stmt.all(limit) as Array<{
    url: string;
    title: string | null;
    downloadedAt: string;
    filePath?: string | null;
    thumbnail?: string | null;
  }>;
};
