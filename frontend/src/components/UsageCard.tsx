import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

type Translator = (key: string, options?: Record<string, unknown>) => string;

type UsageCardProps = {
  t: Translator;
};

const UsageCard = ({ t }: UsageCardProps) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("usageCardCollapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("usageCardCollapsed", String(isCollapsed));
  }, [isCollapsed]);

  return (
    <Card className="bg-white/80 transition-all duration-300">
      <div 
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-slate-900">{t("usage.title")}</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-slate-400 hover:text-slate-600"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Button>
      </div>

      {!isCollapsed && (
        <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <li key={num} className="flex gap-3 text-sm text-slate-600">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                  {num}
                </span>
                <span>{t(`usage.step${num}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  );
};

export default UsageCard;
