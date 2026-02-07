import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Checkbox } from "./components/ui/checkbox";
import { Input } from "./components/ui/input";
import { Progress } from "./components/ui/progress";
import { Textarea } from "./components/ui/textarea";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "km", label: "Khmer" }
];

type VideoItem = {
  id: string;
  title: string;
  uploader?: string | null;
  duration?: string | number | null;
  date?: string | null;
  url: string;
  thumbnail?: string | null;
  downloaded?: boolean;
  error?: string | null;
};

type ProgressItem = {
  id: string;
  title: string;
  status: string;
  progress: number;
  error?: string | null;
};

type HistoryItem = {
  url: string;
  title?: string | null;
  downloadedAt: string;
  filePath?: string | null;
  thumbnail?: string | null;
};

const consoleScript =
  "(function(){const links=Array.from(document.querySelectorAll('a[href*=\"/reel/\"],a[href*=\"/videos/\"],a[href*=\"/video/\"]'));const items=links.map((a)=>{const url=a.href.split('?')[0];const img=a.querySelector('img');const thumb=img?img.src:null;return {url,thumbnail:thumb};}).filter((item)=>/(\\/reel\\/\\d+|\\/videos\\/\\d+|\\/video\\/\\d+)/.test(item.url));const map=new Map();items.forEach((item)=>{if(!map.has(item.url)){map.set(item.url,item);}});const unique=Array.from(map.values());console.log('Found items:',unique.length);console.log(JSON.stringify(unique,null,2));return unique;})();";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const parsePastedItems = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [] as Array<{ url: string; thumbnail?: string | null }>;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (typeof entry === "string") {
            return { url: entry };
          }
          if (entry && typeof entry === "object") {
            const item = entry as { url?: string; thumbnail?: string | null };
            return item.url ? { url: item.url, thumbnail: item.thumbnail ?? null } : null;
          }
          return null;
        })
        .filter(Boolean) as Array<{ url: string; thumbnail?: string | null }>;
    }
  } catch (error) {
    // ignore
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ url }));
};

const App = () => {
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<VideoItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [jobStatus, setJobStatus] = useState<
    "idle" | "running" | "completed" | "failed" | "cancelled"
  >("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState("../downloads");
  const [pastedUrls, setPastedUrls] = useState("");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "loading" | "error">(
    "idle"
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const selectableResults = results.filter((item) => !item.downloaded);
  const allSelected =
    selectableResults.length > 0 && selectedIds.length === selectableResults.length;
  const sortedResults = [...results].sort((a, b) => {
    const aDownloaded = Boolean(a.downloaded);
    const bDownloaded = Boolean(b.downloaded);
    if (aDownloaded === bDownloaded) {
      return a.title.localeCompare(b.title);
    }
    return aDownloaded ? 1 : -1;
  });
  const sortedProgress = [...progressItems].sort((a, b) => {
    const aDone = a.progress >= 100 || a.status === "completed";
    const bDone = b.progress >= 100 || b.status === "completed";
    if (aDone === bDone) {
      return a.title.localeCompare(b.title);
    }
    return aDone ? 1 : -1;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(selectableResults.map((item) => item.id));
  };

  const toggleSelection = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }

    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleAnalyze = async () => {
    const items = parsePastedItems(pastedUrls);
    const payload = {
      items,
      urlsText: pastedUrls
    };

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Analyze failed");
      }

      const data = (await response.json()) as { items?: VideoItem[] };
      const nextResults = data.items ?? [];
      setResults(nextResults);
      const selectableIds = nextResults.filter((item) => !item.downloaded).map((item) => item.id);
      setSelectedIds(selectableIds);
      setProgressItems([]);
      setJobStatus("idle");
      setJobId(null);
      console.log("Analyze completed", nextResults.length);
    } catch (error) {
      console.log("Analyze error", error);
    }
  };

  const handleDownload = async () => {
    const selectedVideos = results.filter(
      (item) => selectedIds.includes(item.id) && !item.downloaded
    );
    if (selectedVideos.length === 0) {
      console.log("No videos selected");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: selectedVideos.map((item) => ({
            url: item.url,
            title: item.title,
            thumbnail: item.thumbnail ?? null
          })),
          outputDir
        })
      });

      if (!response.ok) {
        throw new Error("Download start failed");
      }

      const data = (await response.json()) as { jobId: string; items: ProgressItem[] };
      setProgressItems(data.items ?? []);
      setJobStatus("running");
      setJobId(data.jobId);
      startEventStream(data.jobId);
      refreshHistory();
    } catch (error) {
      console.log("Download error", error);
      setJobStatus("failed");
    }
  };

  const handleClear = () => {
    setSelectedIds([]);
    setResults([]);
    setProgressItems([]);
    setJobStatus("idle");
    setPastedUrls("");
    setJobId(null);
    console.log("Cleared selection");
  };

  const refreshHistory = async () => {
    setHistoryStatus("loading");
    try {
      const response = await fetch(`${API_BASE}/api/history?limit=12`);
      if (!response.ok) {
        throw new Error("History fetch failed");
      }
      const data = (await response.json()) as { items?: HistoryItem[] };
      setHistoryItems(data.items ?? []);
      setHistoryStatus("idle");
    } catch (error) {
      console.log("History error", error);
      setHistoryStatus("error");
    }
  };

  const getProgressTone = (item: ProgressItem) => {
    if (item.status === "failed" || item.status === "cancelled") {
      return "warning" as const;
    }

    return item.progress === 100 ? ("success" as const) : ("neutral" as const);
  };

  const handleSaveSettings = () => {
    console.log("Saved output directory", outputDir);
  };

  const handleRevealFolder = () => {
    handleRevealPath(outputDir);
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(consoleScript);
      console.log("Console script copied");
    } catch (error) {
      console.log("Console script copy failed", error);
    }
  };

  const startEventStream = (id: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`${API_BASE}/api/jobs/${id}/stream`);
    eventSource.addEventListener("snapshot", (event) => {
      const payload = JSON.parse(event.data) as {
        status?: "idle" | "running" | "completed" | "failed" | "cancelled";
        items?: ProgressItem[];
      };

      if (payload.status) {
        setJobStatus(payload.status);
      }

      if (payload.items) {
        setProgressItems(payload.items);
      }
    });

    eventSource.addEventListener("progress", (event) => {
      const payload = JSON.parse(event.data) as {
        jobId: string;
        item: ProgressItem;
      };

      setProgressItems((prev) =>
        prev.map((item) => (item.id === payload.item.id ? payload.item : item))
      );
    });

    eventSource.addEventListener("done", (event) => {
      const payload = JSON.parse(event.data) as {
        status?: "completed" | "failed" | "cancelled";
      };
      setJobStatus(payload.status ?? "completed");
      refreshHistory();
      eventSource.close();
    });

    eventSource.onerror = (event) => {
      console.log("SSE error", event);
      eventSource.close();
    };
    eventSourceRef.current = eventSource;
  };

  const handleCancelJob = async () => {
    if (!jobId) {
      return;
    }

    try {
      await fetch(`${API_BASE}/api/jobs/${jobId}/cancel`, { method: "POST" });
      setJobStatus("cancelled");
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      refreshHistory();
    } catch (error) {
      console.log("Cancel error", error);
    }
  };

  const handleRetryFailed = async () => {
    if (!jobId) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/retry`, { method: "POST" });
      if (!response.ok) {
        throw new Error("Retry failed");
      }
      const data = (await response.json()) as { items?: ProgressItem[] };
      if (data.items) {
        setProgressItems(data.items);
      }
      setJobStatus("running");
      startEventStream(jobId);
    } catch (error) {
      console.log("Retry error", error);
    }
  };

  const handleRevealPath = async (path: string) => {
    try {
      await fetch(`${API_BASE}/api/system/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path })
      });
    } catch (error) {
      console.log("Reveal error", error);
    }
  };

  const getDownloadLink = (url: string) =>
    `${API_BASE}/api/files/download?url=${encodeURIComponent(url)}`;

  useEffect(() => {
    refreshHistory();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-amber-50 text-slate-900">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{t("app.tagline")}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{t("app.title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{t("app.status")}</Badge>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
            value={i18n.language}
            onChange={(event) => i18n.changeLanguage(event.target.value)}
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t("form.title")}</h2>
                <p className="mt-2 text-sm text-slate-600">{t("form.subtitle")}</p>
              </div>
              <Badge tone="success">{t("form.ready")}</Badge>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-700">{t("form.scriptLabel")}</span>
                  <Button size="sm" variant="outline" onClick={handleCopyScript}>
                    {t("form.copyScript")}
                  </Button>
                </div>
                <Textarea
                  value={consoleScript}
                  readOnly
                  spellCheck={false}
                  className="cursor-not-allowed bg-slate-100 font-mono text-xs text-slate-500"
                />
                <p className="text-xs text-slate-500">{t("form.scriptHint")}</p>
              </div>
              <label className="grid gap-2 text-sm">
                <span className="text-slate-700">{t("form.urlsLabel")}</span>
                <Textarea
                  placeholder={t("form.urlsPlaceholder")}
                  value={pastedUrls}
                  onChange={(event) => setPastedUrls(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAnalyze}>{t("form.analyze")}</Button>
                <Button variant="outline" onClick={handleDownload}>
                  {t("form.download")}
                </Button>
                <Button variant="ghost" onClick={handleClear}>
                  {t("form.clear")}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{t("results.title")}</h3>
                <p className="mt-1 text-sm text-slate-600">{t("results.description")}</p>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  label={t("results.selectAll")}
                  checked={allSelected}
                  onChange={(event) => toggleSelectAll(event.currentTarget.checked)}
                  disabled={selectableResults.length === 0}
                />
                <Badge tone="warning">{t("results.count", { count: results.length })}</Badge>
              </div>
            </div>

            <div className="mt-5 grid max-h-[420px] gap-4 overflow-y-auto pr-2">
              {results.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {t("results.empty")}
                </div>
              ) : (
                sortedResults.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[auto_1fr_auto]"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-20 w-32 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-32 items-center justify-center rounded-xl bg-amber-100 text-xs font-semibold text-amber-700">
                        {t("results.noThumbnail")}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          aria-label={t("results.selected")}
                          onChange={(event) =>
                            toggleSelection(item.id, event.currentTarget.checked)
                          }
                          disabled={Boolean(item.downloaded)}
                        />
                        <span className="text-sm font-semibold text-slate-900">{item.title}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.uploader ?? t("results.unknownUploader")} •
                        {item.duration ?? t("results.unknownDuration")} •
                        {item.date ?? t("results.unknownDate")}
                      </div>
                      <div className="text-xs text-emerald-600">{item.url}</div>
                      {item.error ? (
                        <div className="text-xs text-rose-600">{item.error}</div>
                      ) : null}
                    </div>
                    <div className="flex items-center">
                      <Badge tone={item.downloaded ? "success" : "neutral"}>
                        {item.downloaded ? t("results.downloaded") : t("results.ready")}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6">
          <Card className="bg-white/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-slate-900">{t("progress.title")}</h3>
                <Badge
                  tone={
                    jobStatus === "failed" || jobStatus === "cancelled"
                      ? "warning"
                      : jobStatus === "completed"
                        ? "success"
                        : "neutral"
                  }
                >
                  {t(`progress.status.${jobStatus}`)}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetryFailed}
                  disabled={!jobId}
                >
                  {t("progress.retry")}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelJob} disabled={!jobId}>
                  {t("progress.cancel")}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-4 text-sm text-slate-600">
              <p>{t("progress.description")}</p>
              {progressItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {t("progress.empty")}
                </div>
              ) : (
                <div className="grid max-h-[360px] gap-4 overflow-y-auto pr-2">
                  {sortedProgress.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{item.title}</span>
                      <Badge tone={getProgressTone(item)}>
                        {item.status}
                      </Badge>
                    </div>
                    <Progress value={item.progress} className="mt-3" />
                    <div className="mt-2 text-xs text-slate-500">
                      {t("progress.percent", { value: item.progress })}
                    </div>
                    {item.status === "failed" && item.error ? (
                      <div className="mt-2 text-xs text-rose-600">{item.error}</div>
                    ) : null}
                  </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-white/80">
            <h3 className="text-base font-semibold text-slate-900">{t("usage.title")}</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>{t("usage.step1")}</li>
              <li>{t("usage.step2")}</li>
              <li>{t("usage.step3")}</li>
              <li>{t("usage.step4")}</li>
              <li>{t("usage.step5")}</li>
              <li>{t("usage.step6")}</li>
            </ol>
          </Card>

          <Card className="bg-white/80">
            <h3 className="text-base font-semibold text-slate-900">{t("settings.title")}</h3>
            <div className="mt-4 grid gap-4 text-sm text-slate-600">
              <label className="grid gap-2">
                <span className="text-slate-700">{t("settings.output")}</span>
                <Input
                  value={outputDir}
                  onChange={(event) => setOutputDir(event.target.value)}
                  placeholder="./downloads"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" onClick={handleSaveSettings}>
                  {t("settings.save")}
                </Button>
                <Button size="sm" variant="outline" onClick={handleRevealFolder}>
                  {t("settings.reveal")}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-white/80">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">{t("history.title")}</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                  href={`${API_BASE}/api/files/download-all`}
                >
                  {t("history.downloadAll")}
                </a>
                <Button size="sm" variant="outline" onClick={refreshHistory}>
                  {t("history.refresh")}
                </Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              {historyStatus === "error" ? (
                <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-600">
                  {t("history.error")}
                </div>
              ) : historyItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                  {historyStatus === "loading" ? t("history.loading") : t("history.empty")}
                </div>
              ) : (
                historyItems.map((item) => (
                  <div
                    key={item.url}
                    className="grid gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 md:grid-cols-[auto_1fr_auto]"
                  >
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title ?? "History thumbnail"}
                        className="h-14 w-20 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
                        {t("history.noThumbnail")}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {item.title ?? t("history.untitled")}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{item.url}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {t("history.date", { value: new Date(item.downloadedAt).toLocaleString() })}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRevealPath(item.filePath ?? outputDir)
                        }
                      >
                        {t("history.reveal")}
                      </Button>
                      <a
                        className="ml-2 inline-flex items-center rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
                        href={getDownloadLink(item.url)}
                      >
                        {t("history.download")}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="bg-white/80">
            <h3 className="text-base font-semibold text-slate-900">{t("help.title")}</h3>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>{t("help.step1")}</li>
              <li>{t("help.step2")}</li>
              <li>{t("help.step3")}</li>
              <li>{t("help.step4")}</li>
            </ol>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default App;
