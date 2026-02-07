import "dotenv/config";
import cors from "cors";
import express from "express";
import path from "path";
import analyzeRouter from "./routes/analyze";
import filesRouter from "./routes/files";
import historyRouter from "./routes/history";
import jobsRouter from "./routes/jobs";
import streamRouter from "./routes/stream";
import systemRouter from "./routes/system";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/analyze", analyzeRouter);
app.use("/api/files", filesRouter);
app.use("/api/history", historyRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/jobs", streamRouter);
app.use("/api/system", systemRouter);

const staticDir = process.env.STATIC_DIR
  ? path.resolve(process.env.STATIC_DIR)
  : path.resolve(__dirname, "../public");

app.use(express.static(staticDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => {
  console.log(`API listening on ${port}`);
});
