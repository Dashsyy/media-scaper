import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type AnalyzeFormCardProps = {
  t: Translator;
  pastedUrls: string;
  analyzeStatus: "idle" | "loading" | "error";
  forceDownload: boolean;
  onCopyScript: () => void;
  onAnalyze: () => void;
  onDownload: () => void;
  onClear: () => void;
  onPastedUrlsChange: (value: string) => void;
  onForceDownloadChange: (value: boolean) => void;
};

const AnalyzeFormCard = ({
  t,
  pastedUrls,
  analyzeStatus,
  forceDownload,
  onCopyScript,
  onAnalyze,
  onDownload,
  onClear,
  onPastedUrlsChange,
  onForceDownloadChange
}: AnalyzeFormCardProps) => (
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
          <Button size="sm" variant="outline" onClick={onCopyScript}>
            {t("form.copyScript")}
          </Button>
        </div>
        <p className="text-xs text-slate-500">{t("form.scriptHint")}</p>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="text-slate-700">{t("form.urlsLabel")}</span>
        <Textarea
          placeholder={t("form.urlsPlaceholder")}
          value={pastedUrls}
          onChange={(event) => onPastedUrlsChange(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onAnalyze} disabled={analyzeStatus === "loading"}>
          {analyzeStatus === "loading" ? t("results.loading") : t("form.analyze")}
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          disabled={analyzeStatus === "loading"}
        >
          {t("form.download")}
        </Button>
        <Button variant="ghost" onClick={onClear}>
          {t("form.clear")}
        </Button>
        <Checkbox
          label={t("form.forceDownload")}
          checked={forceDownload}
          onChange={(event) => onForceDownloadChange(event.currentTarget.checked)}
        />
      </div>
    </div>
  </Card>
);

export default AnalyzeFormCard;
