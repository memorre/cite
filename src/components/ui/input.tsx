import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-[12px] border border-border bg-surface px-3.5 text-[17px] text-foreground placeholder:text-muted/80 transition-[border-color,box-shadow] duration-200 outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-ring disabled:opacity-50 sm:text-[15px]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
