"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "search" | "error";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("clay-empty", className)}
        {...props}
      >
        {icon && <div className="clay-empty-icon text-muted-foreground">{icon}</div>}
        <h3 className="clay-empty-title">{title}</h3>
        {description && <p className="clay-empty-desc">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
        {children}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };