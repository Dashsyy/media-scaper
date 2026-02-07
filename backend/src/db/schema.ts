import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url").notNull(),
  outputDir: text("output_dir").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const jobVideos = pgTable("job_videos", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  webpageUrl: text("webpage_url").notNull(),
  title: text("title").notNull(),
  uploader: text("uploader"),
  duration: integer("duration"),
  uploadDate: text("upload_date"),
  thumbnail: text("thumbnail"),
  filesize: integer("filesize"),
  status: text("status").notNull(),
  progress: integer("progress").notNull(),
  error: text("error")
});
