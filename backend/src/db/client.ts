import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const databaseUrl =
  process.env.DATABASE_URL

export const pool = new Pool({ connectionString: databaseUrl });

export const db = drizzle(pool);

export const initDb = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS downloaded_videos (
          url TEXT PRIMARY KEY,
          title TEXT,
          thumbnail TEXT,
          file_path TEXT,
          downloaded_at TEXT NOT NULL
        );
      `);

      await pool.query(`ALTER TABLE downloaded_videos ADD COLUMN IF NOT EXISTS thumbnail TEXT;`);
      await pool.query(`ALTER TABLE downloaded_videos ADD COLUMN IF NOT EXISTS file_path TEXT;`);
      console.log("Database initialized successfully.");
      return;
    } catch (error) {
      console.error(`Database initialization failed. Retrying... (${retries} left)`);
      console.error(error instanceof Error ? error.message : "Unknown error");
      retries -= 1;
      if (retries === 0) {
        throw error;
      }
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
};
