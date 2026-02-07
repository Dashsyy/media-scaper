import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const databaseUrl = process.env.DATABASE_URL ?? "./dev.db";

export const sqlite = new Database(databaseUrl);

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS downloaded_videos (
    url TEXT PRIMARY KEY,
    title TEXT,
    thumbnail TEXT,
    file_path TEXT,
    downloaded_at TEXT NOT NULL
  );
`);

const ensureColumn = (column: string, definition: string) => {
  const columns = sqlite.prepare("PRAGMA table_info(downloaded_videos)").all() as Array<{
    name: string;
  }>;
  const exists = columns.some((item) => item.name === column);
  if (!exists) {
    sqlite.exec(`ALTER TABLE downloaded_videos ADD COLUMN ${column} ${definition}`);
  }
};

ensureColumn("thumbnail", "TEXT");
ensureColumn("file_path", "TEXT");

export const db = drizzle(sqlite);
