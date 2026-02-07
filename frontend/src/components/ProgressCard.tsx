import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import type { ProgressItem } from "../types";

type Translator = (key: string, options?: Record<string, unknown>) => string;
type ProgressTone = "success" | "warning" | "neutral";

type ProgressCardProps = {
  t: Translator;
  jobStatus: "idle" | "running" | "completed" | "failed" | "cancelled";
  jobId: string | null;
  sortedProgress: ProgressItem[];
  onRetryFailed: () => void;
  onCancel: () => void;
  getProgressTone: (item: ProgressItem) => ProgressTone;
  truncateTitle: (value: string, maxLength?: number) => string;
};

const ProgressCard = ({
  t,
  jobStatus,
  jobId,
  sortedProgress,
  onRetryFailed,
  onCancel,
  getProgressTone,
  truncateTitle
}: ProgressCardProps) => (
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
        <Button size="sm" variant="outline" onClick={onRetryFailed} disabled={!jobId}>
          {t("progress.retry")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={!jobId}>
          {t("progress.cancel")}
        </Button>
      </div>
    </div>
    <div className="mt-4 grid gap-4 text-sm text-slate-600">
      <p>{t("progress.description")}</p>
      {sortedProgress.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {t("progress.empty")}
        </div>
      ) : (
        <div className="grid max-h-[360px] gap-4 overflow-y-auto pr-2">
          {sortedProgress.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">
                  {truncateTitle(item.title, 60)}
                </span>
                <Badge tone={getProgressTone(item)}>{item.status}</Badge>
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
);

export default ProgressCard;
