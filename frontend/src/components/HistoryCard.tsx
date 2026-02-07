import { Button } from "./ui/button";
import { Card } from "./ui/card";
import type { HistoryItem } from "../types";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type HistoryCardProps = {
  t: Translator;
  historyItems: HistoryItem[];
  historyStatus: "idle" | "loading" | "error";
  downloadAllUrl: string;
  onRefresh: () => void;
  onRevealPath: (path: string) => void;
  getDownloadLink: (url: string) => string;
  truncateTitle: (value: string, maxLength?: number) => string;
};

const HistoryCard = ({
  t,
  historyItems,
  historyStatus,
  downloadAllUrl,
  onRefresh,
  onRevealPath,
  getDownloadLink,
  truncateTitle
}: HistoryCardProps) => (
  <Card className="bg-white/80">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-slate-900">{t("history.title")}</h3>
      <div className="flex flex-wrap gap-2">
        <a
          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-400"
          href={downloadAllUrl}
        >
          {t("history.downloadAll")}
        </a>
        <Button size="sm" variant="outline" onClick={onRefresh}>
          {t("history.refresh")}
        </Button>
      </div>
    </div>
    <div className="mt-4 grid max-h-[360px] gap-3 overflow-y-auto pr-2 text-sm text-slate-600">
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
                {item.title ? truncateTitle(item.title, 60) : t("history.untitled")}
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
                onClick={() => (item.filePath ? onRevealPath(item.filePath) : null)}
                disabled={!item.filePath}
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
);

export default HistoryCard;
