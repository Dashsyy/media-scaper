import { useState } from "react";
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
}: AnalyzeFormCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyScript();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{t("form.title")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("form.subtitle")}</p>
        </div>
        <Badge tone="success">{t("form.ready")}</Badge>
      </div>

      <div className="mt-6 grid gap-4">
        <div id="tour-step-1" className="grid gap-2 text-sm p-3 rounded-xl bg-blue-50/50 border border-blue-100 transition-all">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-700 font-medium">{t("form.scriptLabel")}</span>
            <div className="flex items-center gap-2">
              {copied && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter animate-in fade-in slide-in-from-right-2 duration-300">
                  {t("form.copied")}
                </span>
              )}
              <Button
                size="sm"
                variant={copied ? "default" : "outline"}
                onClick={handleCopy}
                className={`transition-all duration-300 ${copied ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 shadow-emerald-100" : "bg-white shadow-sm border-blue-200 hover:bg-blue-50"}`}
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : t("form.copyScript")}
              </Button>
              </div>
              </div>
              <p className="text-xs text-slate-500">{t("form.scriptHint")}</p>
              </div>

        <label id="tour-step-2" className="grid gap-2 text-sm p-3 rounded-xl border border-transparent focus-within:border-blue-200 transition-all">
          <span className="text-slate-700 font-medium">{t("form.urlsLabel")}</span>
          <Textarea
            placeholder={t("form.urlsPlaceholder")}
            value={pastedUrls}
            onChange={(event) => onPastedUrlsChange(event.target.value)}
            className="min-h-[120px] bg-white/50"
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
      };
  export default AnalyzeFormCard;

