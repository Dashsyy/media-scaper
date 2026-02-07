import { cn } from "../../lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
};

export const Progress = ({ value, className }: ProgressProps) => (
  <div className={cn("h-2 w-full rounded-full bg-slate-200", className)}>
    <div
      className="h-2 rounded-full bg-emerald-500 transition-all"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);
