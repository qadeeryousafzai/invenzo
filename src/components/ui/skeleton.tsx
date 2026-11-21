"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
  lines?: number;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "text", lines = 1, style, ...props }, ref) => {
    const baseStyle = { ...style } as React.CSSProperties;

    if (variant === "text") {
      baseStyle.height = "1rem";
      if (lines > 1) {
        baseStyle.display = "flex";
        baseStyle.flexDirection = "column";
        baseStyle.gap = "0.625rem";
      }
    }

    const renderLines = () => {
      if (variant !== "text" || lines <= 1) return null;
      return Array.from({ length: lines - 1 }, (_, i) => (
        <div key={i} className="clay-skeleton" style={{ width: `${90 - i * 10}%` }} />
      ));
    };

    return (
      <>
        <div
          ref={ref}
          className={cn("clay-skeleton", variant === "circular" && "rounded-full", variant === "card" && "rounded-xl", className)}
          style={baseStyle}
          {...props}
        />
        {renderLines()}
      </>
    );
  }
);
Skeleton.displayName = "Skeleton";

export { Skeleton };