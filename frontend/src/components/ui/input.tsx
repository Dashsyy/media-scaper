import { type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className, ...props }: InputProps) => (
  <input
    className={cn(
      "h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500",
      className
    )}
    {...props}
  />
);
