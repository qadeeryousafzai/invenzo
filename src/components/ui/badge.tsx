"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "px-2.5 py-0.75 text-[0.625rem]",
  md: "px-3 py-1 text-xs",
};

const variantClasses = {
  primary: "clay-badge-primary",
  success: "clay-badge-success",
  warning: "clay-badge-warning",
  danger: "clay-badge-danger",
  info: "clay-badge-info",
  neutral: "clay-badge-neutral",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "md", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("clay-badge", variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge };