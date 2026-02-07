import { type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Checkbox = ({ className, label, ...props }: CheckboxProps) => (
  <label className="flex items-center gap-2 text-sm text-slate-700">
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 rounded border border-slate-300 bg-white text-emerald-500 focus:ring-emerald-400",
        className
      )}
      {...props}
    />
    {label ? <span>{label}</span> : null}
  </label>
);
