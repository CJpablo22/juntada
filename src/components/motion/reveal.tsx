"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Reveal({
  children,
  className,
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  return (
    <div
      className={cn("animate-rise", className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
