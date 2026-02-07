import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import type { VideoItem } from "../types";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type ResultsCardProps = {
  t: Translator;
  results: VideoItem[];
  sortedResults: VideoItem[];
  selectedIds: string[];
  allSelected: boolean;
  analyzeStatus: "idle" | "loading" | "error";
  analyzeProgress: { completed: number; total: number };
  hasEditedTitles: boolean;
  allowDownloadedSelection: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelection: (id: string, checked: boolean) => void;
  onEditTitle: (item: VideoItem) => void;
  onRevertAll: () => void;
  truncateTitle: (value: string, maxLength?: number) => string;
};

const ResultsCard = ({
  t,
  results,
  sortedResults,
  selectedIds,
  allSelected,
  analyzeStatus,
  analyzeProgress,
  hasEditedTitles,
  allowDownloadedSelection,
  onToggleSelectAll,
  onToggleSelection,
  onEditTitle,
  onRevertAll,
  truncateTitle
}: ResultsCardProps) => (
  <Card className="bg-white/80">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{t("results.title")}</h3>
        <p className="mt-1 text-sm text-slate-600">{t("results.description")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Checkbox
          label={t("results.selectAll")}
          checked={allSelected}
          onChange={(event) => onToggleSelectAll(event.currentTarget.checked)}
          disabled={allowDownloadedSelection ? results.length === 0 : results.every((item) => item.downloaded)}
        />
        <Button size="sm" variant="ghost" onClick={onRevertAll} disabled={!hasEditedTitles}>
          {t("results.revertAll")}
        </Button>
        <Badge tone="warning">{t("results.count", { count: results.length })}</Badge>
      </div>
    </div>

    <div className="mt-5 grid max-h-[420px] gap-4 overflow-y-auto pr-2">
      {analyzeStatus === "loading" ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          <span className="animate-pulse">
            {analyzeProgress.total > 0
              ? t("results.loadingCount", analyzeProgress)
              : t("results.loading")}
          </span>
        </div>
      ) : analyzeStatus === "error" ? (
        <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-4 py-8 text-center text-sm text-rose-600">
          {t("results.error")}
        </div>
      ) : results.length === 0 ? (
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
              <div className="flex flex-wrap items-center gap-2">
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  aria-label={t("results.selected")}
                  onChange={(event) => onToggleSelection(item.id, event.currentTarget.checked)}
                  disabled={!allowDownloadedSelection && Boolean(item.downloaded)}
                />
                <span className="text-sm font-semibold text-slate-900">
                  {truncateTitle(item.title)}
                </span>
                <Button size="sm" variant="ghost" onClick={() => onEditTitle(item)}>
                  {t("results.edit")}
                </Button>
              </div>
              <div className="text-xs text-slate-500">
                {item.uploader ?? t("results.unknownUploader")} •
                {item.duration ?? t("results.unknownDuration")} •
                {item.date ?? t("results.unknownDate")}
              </div>
              <div className="text-xs text-emerald-600">{item.url}</div>
              {item.error ? <div className="text-xs text-rose-600">{item.error}</div> : null}
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
);

export default ResultsCard;
