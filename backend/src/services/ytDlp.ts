import { spawn } from "child_process";

type AnalyzeResult = {
  title: string | null;
  uploader: string | null;
  duration: number | null;
  uploadDate: string | null;
  thumbnail: string | null;
  webpageUrl: string | null;
};

type DownloadOptions = {
  url: string;
  outputDir: string;
  onProgress: (progress: number) => void;
  onLog?: (line: string) => void;
  onFilePath?: (filePath: string) => void;
  onProcess?: (process: ReturnType<typeof spawn>) => void;
};

const progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%/;
const destinationRegex = /Destination:\s+(.*)$/i;

const parseJson = (raw: string) => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (error) {
    return null;
  }
};

export const runYtDlpAnalyze = (url: string) =>
  new Promise<AnalyzeResult>((resolve, reject) => {
    const args = ["-J", "--no-playlist", "--skip-download", url];
    const process = spawn("yt-dlp", args);
    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(errorOutput || `yt-dlp exited with code ${code}`));
        return;
      }

      const parsed = parseJson(output);
      if (!parsed) {
        reject(new Error("Unable to parse yt-dlp output"));
        return;
      }

      resolve({
        title: typeof parsed.title === "string" ? parsed.title : null,
        uploader: typeof parsed.uploader === "string" ? parsed.uploader : null,
        duration: typeof parsed.duration === "number" ? parsed.duration : null,
        uploadDate: typeof parsed.upload_date === "string" ? parsed.upload_date : null,
        thumbnail: typeof parsed.thumbnail === "string" ? parsed.thumbnail : null,
        webpageUrl: typeof parsed.webpage_url === "string" ? parsed.webpage_url : null
      });
    });
  });

export const runYtDlpDownload = ({
  url,
  outputDir,
  onProgress,
  onLog,
  onFilePath,
  onProcess
}: DownloadOptions) =>
  new Promise<{ filePath: string | null }>((resolve, reject) => {
    const args = [
      "--newline",
      "--trim-filenames",
      "60",
      "-o",
      `${outputDir}/%(id)s.%(ext)s`,
      url
    ];
    const process = spawn("yt-dlp", args);
    let filePath: string | null = null;
    let errorOutput = "";

    onProcess?.(process);

    process.stdout.on("data", (data: Buffer) => {
      const lines = data
        .toString()
        .split(/\r?\n/)
        .filter((line: string) => line.length > 0);
      lines.forEach((line: string) => {
        onLog?.(line);
        const progressMatch = line.match(progressRegex);
        if (progressMatch) {
          const value = Number(progressMatch[1]);
          if (!Number.isNaN(value)) {
            onProgress(Math.min(100, Math.max(0, value)));
          }
        }
        const destinationMatch = line.match(destinationRegex);
        if (destinationMatch) {
          filePath = destinationMatch[1].trim();
          if (filePath) {
            onFilePath?.(filePath);
          }
        }
      });
    });

    process.stderr.on("data", (data: Buffer) => {
      const lines = data
        .toString()
        .split(/\r?\n/)
        .filter((line: string) => line.length > 0);
      errorOutput += `${lines.join("\n")}\n`;
      lines.forEach((line: string) => onLog?.(line));
    });

    process.on("error", (error) => {
      reject(error);
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve({ filePath });
        return;
      }

      const message = errorOutput.trim();
      reject(new Error(message || `yt-dlp exited with code ${code}`));
    });
  });
