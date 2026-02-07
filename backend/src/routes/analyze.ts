import { Router } from "express";
import { getDownloadedSet } from "../services/downloadHistory";
import { runYtDlpAnalyze } from "../services/ytDlp";
import { buildTitleFromUrl, parseInputItems } from "../utils/urls";

const router = Router();

router.post("/", (req, res) => {
  const items = parseInputItems(req.body);
  const downloadedSet = getDownloadedSet(items.map((item) => item.url));

  const responseItems = [] as Array<Record<string, unknown>>;

  const run = async () => {
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      try {
        const metadata = await runYtDlpAnalyze(item.url);
        responseItems.push({
          id: `item-${index + 1}`,
          title: metadata.title ?? buildTitleFromUrl(item.url),
          uploader: metadata.uploader ?? "Facebook",
          duration: metadata.duration,
          date: metadata.uploadDate,
          url: metadata.webpageUrl ?? item.url,
          thumbnail: metadata.thumbnail ?? item.thumbnail,
          downloaded: downloadedSet.has(item.url)
        });
      } catch (error) {
        responseItems.push({
          id: `item-${index + 1}`,
          title: buildTitleFromUrl(item.url),
          uploader: "Facebook",
          duration: null,
          date: null,
          url: item.url,
          thumbnail: item.thumbnail,
          downloaded: downloadedSet.has(item.url),
          error: error instanceof Error ? error.message : "Metadata fetch failed"
        });
      }
    }

    res.json({ total: responseItems.length, items: responseItems });
  };

  run().catch((error) => {
    res.status(500).json({ error: error instanceof Error ? error.message : "Analyze failed" });
  });
});

export default router;
