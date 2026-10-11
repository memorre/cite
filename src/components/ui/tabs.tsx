"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

// Segmented control, as in iOS and macOS.
export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-0.5 rounded-[9px] bg-[var(--seg-bg)] p-[2px]", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "rounded-[7px] px-3.5 py-1 text-[13px] font-medium text-foreground/80 transition-[background-color,box-shadow,color] duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring data-[state=active]:bg-[var(--seg-thumb)] data-[state=active]:text-foreground data-[state=active]:shadow-[0_3px_8px_rgba(0,0,0,0.12),0_3px_1px_rgba(0,0,0,0.04)]",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 focus-visible:outline-none animate-in fade-in-0 duration-300", className)}
      {...props}
    />
  );
}
