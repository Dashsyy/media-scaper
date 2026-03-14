import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AnalyzeFormCard from "./components/AnalyzeFormCard";
import AppHeader from "./components/AppHeader";
import EditTitleDialog from "./components/EditTitleDialog";
import HistoryCard from "./components/HistoryCard";
import ProgressCard from "./components/ProgressCard";
import ResultsCard from "./components/ResultsCard";
import UsageCard from "./components/UsageCard";
import type { HistoryItem, ProgressItem, VideoItem } from "./types";
import { truncateTitle } from "./utils/text";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "km", label: "Khmer" }
];

type AnalyzeStatus = "idle" | "loading" | "error";
type JobStatus = "idle" | "running" | "completed" | "failed" | "cancelled";

const consoleScript =
  "(function(){const links=Array.from(document.querySelectorAll('a[href*=\"/reel/\"],a[href*=\"/videos/\"],a[href*=\"/video/\"]'));const items=links.map((a)=>{const url=a.href.split('?')[0];const img=a.querySelector('img');const thumb=img?img.src:null;return {url,thumbnail:thumb};}).filter((item)=>/(\\/reel\\/\\d+|\\/videos\\/\\d+|\\/video\\/\\d+)/.test(item.url));const map=new Map();items.forEach((item)=>{if(!map.has(item.url)){map.set(item.url,item);}});const unique=Array.from(map.values());console.log('Found items:',unique.length);console.log(JSON.stringify(unique,null,2));return unique;})();";

const API_BASE = (import.meta.env.VITE_API_URL as string) || "";

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
  useEffect(() => {
    console.log("Current API_BASE:", API_BASE);
  }, []);
  const { t, i18n } = useTranslation();
  const [results, setResults] = useState<VideoItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobId, setJobId] = useState<string | null>(null);
  const [pastedUrls, setPastedUrls] = useState("");
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyStatus, setHistoryStatus] = useState<AnalyzeStatus>("idle");
  const [analyzeStatus, setAnalyzeStatus] = useState<AnalyzeStatus>("idle");
  const [analyzeJobId, setAnalyzeJobId] = useState<string | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState({ completed: 0, total: 0 });
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [forceDownload, setForceDownload] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const analyzePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectableResults = forceDownload
    ? results
    : results.filter((item) => !item.downloaded);
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
  const hasEditedTitles = results.some(
    (item) => item.originalTitle && item.title !== item.originalTitle
  );

  const editTarget = editTargetId
    ? results.find((item) => item.id === editTargetId) ?? null
    : null;

  useEffect(() => {
    return () => {
      if (analyzePollRef.current) {
        clearInterval(analyzePollRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (forceDownload) {
      return;
    }

    setSelectedIds((prev) =>
      prev.filter((id) => {
        const item = results.find((entry) => entry.id === id);
        return item ? !item.downloaded : false;
      })
    );
  }, [forceDownload, results]);

  const stopAnalyzePolling = () => {
    if (analyzePollRef.current) {
      clearInterval(analyzePollRef.current);
      analyzePollRef.current = null;
    }
  };

  const normalizeAnalyzeItems = (items: VideoItem[]) =>
    items.map((item) => ({
      ...item,
      originalTitle: item.originalTitle ?? item.title,
      title: item.title
    }));

  const openEditDialog = (item: VideoItem) => {
    setEditTargetId(item.id);
    setEditTitleValue(item.title);
  };

  const closeEditDialog = () => {
    setEditTargetId(null);
    setEditTitleValue("");
  };

  const handleSaveTitle = () => {
    if (!editTargetId) {
      return;
    }

    setResults((prev) =>
      prev.map((item) => {
        if (item.id !== editTargetId) {
          return item;
        }

        const nextTitle = editTitleValue.trim();
        return {
          ...item,
          title: nextTitle || item.originalTitle || item.title
        };
      })
    );
    closeEditDialog();
  };

  const handleRevertTitle = (id: string) => {
    setResults((prev) =>
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          title: item.originalTitle ?? item.title
        };
      })
    );
  };

  const handleRevertAllTitles = () => {
    setResults((prev) =>
      prev.map((item) => ({
        ...item,
        title: item.originalTitle ?? item.title
      }))
    );
  };

  const pollAnalyzeJob = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/analyze/${jobId}`);
      if (!response.ok) {
        throw new Error("Analyze status failed");
      }

      const data = (await response.json()) as {
        status?: "queued" | "running" | "completed" | "failed";
        total?: number;
        completed?: number;
        items?: VideoItem[];
      };

      const total = data.total ?? 0;
      const completed = data.completed ?? 0;
      setAnalyzeProgress({ total, completed });

      if (data.items) {
        setResults(normalizeAnalyzeItems(data.items));
      }

      if (data.status === "completed") {
        setAnalyzeStatus("idle");
        stopAnalyzePolling();
        const selectableIds = (data.items ?? [])
          .filter((item) => forceDownload || !item.downloaded)
          .map((item) => item.id);
        setSelectedIds(selectableIds);
        setProgressItems([]);
        setJobStatus("idle");
        setJobId(null);
        return;
      }

      if (data.status === "failed") {
        setAnalyzeStatus("error");
        stopAnalyzePolling();
      }
    } catch (error) {
      console.log("Analyze error", error);
      setAnalyzeStatus("error");
      stopAnalyzePolling();
    }
  };

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
    if (items.length === 0) {
      return;
    }
    const payload = {
      items,
      urlsText: pastedUrls
    };

    try {
      setAnalyzeStatus("loading");
      setAnalyzeJobId(null);
      setAnalyzeProgress({ completed: 0, total: items.length });
      setResults([]);
      setSelectedIds([]);
      setEditTargetId(null);
      setEditTitleValue("");
      stopAnalyzePolling();
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

      const data = (await response.json()) as { jobId?: string };
      if (!data.jobId) {
        throw new Error("Analyze failed");
      }

      const jobId = data.jobId;
      setAnalyzeJobId(jobId);
      await pollAnalyzeJob(jobId);
      analyzePollRef.current = setInterval(() => {
        pollAnalyzeJob(jobId).catch(() => {
          // handled in poll
        });
      }, 1500);
    } catch (error) {
      console.log("Analyze error", error);
      setAnalyzeStatus("error");
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
          force: forceDownload
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
    stopAnalyzePolling();
    setSelectedIds([]);
    setResults([]);
    setProgressItems([]);
    setJobStatus("idle");
    setPastedUrls("");
    setJobId(null);
    setAnalyzeJobId(null);
    setAnalyzeStatus("idle");
    setAnalyzeProgress({ completed: 0, total: 0 });
    setEditTargetId(null);
    setEditTitleValue("");
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
      <AppHeader
        t={t}
        language={i18n.language}
        languageOptions={languageOptions}
        onLanguageChange={(language) => i18n.changeLanguage(language)}
      />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6">
          <AnalyzeFormCard
            t={t}
            pastedUrls={pastedUrls}
            analyzeStatus={analyzeStatus}
            forceDownload={forceDownload}
            onCopyScript={handleCopyScript}
            onAnalyze={handleAnalyze}
            onDownload={handleDownload}
            onClear={handleClear}
            onPastedUrlsChange={setPastedUrls}
            onForceDownloadChange={setForceDownload}
          />
          <ResultsCard
            t={t}
            results={results}
            sortedResults={sortedResults}
            selectedIds={selectedIds}
            allSelected={allSelected}
            analyzeStatus={analyzeStatus}
            analyzeProgress={analyzeProgress}
            hasEditedTitles={hasEditedTitles}
            allowDownloadedSelection={forceDownload}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelection={toggleSelection}
            onEditTitle={openEditDialog}
            onRevertAll={handleRevertAllTitles}
            truncateTitle={truncateTitle}
          />
        </div>

        <div className="grid gap-6">
          <ProgressCard
            t={t}
            jobStatus={jobStatus}
            jobId={jobId}
            sortedProgress={sortedProgress}
            onRetryFailed={handleRetryFailed}
            onCancel={handleCancelJob}
            getProgressTone={getProgressTone}
            truncateTitle={truncateTitle}
          />
          <UsageCard t={t} />
          <HistoryCard
            t={t}
            historyItems={historyItems}
            historyStatus={historyStatus}
            downloadAllUrl={`${API_BASE}/api/files/download-all`}
            onRefresh={refreshHistory}
            onRevealPath={handleRevealPath}
            getDownloadLink={getDownloadLink}
            truncateTitle={truncateTitle}
          />

        </div>
      </main>
      <EditTitleDialog
        t={t}
        open={Boolean(editTarget)}
        titleValue={editTitleValue}
        showRevert={Boolean(editTarget?.originalTitle && editTarget.title !== editTarget.originalTitle)}
        onTitleChange={setEditTitleValue}
        onSave={handleSaveTitle}
        onCancel={closeEditDialog}
        onRevert={() => {
          if (editTarget) {
            handleRevertTitle(editTarget.id);
          }
          closeEditDialog();
        }}
      />
    </div>
  );
};

export default App;
