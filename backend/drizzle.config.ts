import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  driver: "pg",
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://media_scraper:media_scraper@localhost:5432/media_scraper"
  }
} satisfies Config;
