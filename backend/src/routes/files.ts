import { Router } from "express";
import path from "path";
import { existsSync } from "fs";
import archiver from "archiver";
import { getDownloadedByUrl, listDownloadedFiles } from "../services/downloadHistory";

const router = Router();

router.get("/download", (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  if (!url) {
    res.status(400).json({ error: "Missing url" });
    return;
  }

  const record = getDownloadedByUrl(url);
  if (!record?.filePath) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  const resolved = path.resolve(record.filePath);
  if (!existsSync(resolved)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.download(resolved);
});

router.get("/download-all", (req, res) => {
  const records = listDownloadedFiles().filter((item) =>
    item.filePath ? existsSync(item.filePath) : false
  );

  if (records.length === 0) {
    res.status(404).json({ error: "No files available" });
    return;
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", "attachment; filename=media-scraper-downloads.zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (error) => {
    res.status(500).end(error.message);
  });
  archive.pipe(res);

  records.forEach((record, index) => {
    if (!record.filePath) {
      return;
    }
    const filename = path.basename(record.filePath);
    const prefix = String(index + 1).padStart(3, "0");
    archive.file(record.filePath, { name: `${prefix}-${filename}` });
  });

  archive.finalize();
});

export default router;
