import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200 bg-white p-6 shadow-lg",
      className
    )}
    {...props}
  />
);
