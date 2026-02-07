import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
};

const baseStyles =
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:opacity-50";

const variants = {
  default: "bg-emerald-500 text-white hover:bg-emerald-400",
  outline: "border border-slate-300 text-slate-700 hover:border-slate-400",
  ghost: "text-slate-600 hover:bg-slate-100"
};

const sizes = {
  default: "h-11 px-5",
  sm: "h-9 px-4",
  lg: "h-12 px-6"
};

export const Button = ({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) => (
  <button
    className={cn(baseStyles, variants[variant], sizes[size], className)}
    {...props}
  />
);
