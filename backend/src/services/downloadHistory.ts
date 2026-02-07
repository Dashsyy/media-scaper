import { pool } from "../db/client";

type DownloadedRecord = {
  url: string;
  title: string | null;
  downloadedAt: string;
  filePath?: string | null;
  thumbnail?: string | null;
};

export const getDownloadedSet = async (urls: string[]) => {
  if (urls.length === 0) {
    return new Set<string>();
  }

  const { rows } = await pool.query<{ url: string }>(
    "SELECT url FROM downloaded_videos WHERE url = ANY($1)",
    [urls]
  );
  return new Set(rows.map((row) => row.url));
};

export const markDownloaded = async (
  url: string,
  title?: string,
  filePath?: string | null,
  thumbnail?: string | null
) => {
  const now = new Date().toISOString();
  await pool.query(
    `INSERT INTO downloaded_videos (url, title, file_path, thumbnail, downloaded_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (url)
     DO UPDATE SET
       title = EXCLUDED.title,
       file_path = EXCLUDED.file_path,
       thumbnail = EXCLUDED.thumbnail,
       downloaded_at = EXCLUDED.downloaded_at`,
    [url, title ?? null, filePath ?? null, thumbnail ?? null, now]
  );
};

export const listDownloaded = async (limit = 20) => {
  const { rows } = await pool.query<DownloadedRecord>(
    `SELECT url,
            title,
            thumbnail,
            file_path as "filePath",
            downloaded_at as "downloadedAt"
     FROM downloaded_videos
     ORDER BY downloaded_at DESC
     LIMIT $1`,
    [limit]
  );
  return rows;
};

export const listDownloadedFiles = async () => {
  const { rows } = await pool.query<DownloadedRecord>(
    `SELECT url,
            title,
            thumbnail,
            file_path as "filePath",
            downloaded_at as "downloadedAt"
     FROM downloaded_videos
     WHERE file_path IS NOT NULL
     ORDER BY downloaded_at DESC`
  );
  return rows;
};

export const getDownloadedByUrl = async (url: string) => {
  const { rows } = await pool.query<DownloadedRecord>(
    `SELECT url,
            title,
            thumbnail,
            file_path as "filePath",
            downloaded_at as "downloadedAt"
     FROM downloaded_videos
     WHERE url = $1
     LIMIT 1`,
    [url]
  );
  return rows[0];
};
