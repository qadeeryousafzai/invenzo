"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, hint, error, leadingIcon, trailingIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leadingIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              "clay-input",
              leadingIcon && "pl-12",
              trailingIcon && "pr-12",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              className
            )}
            ref={ref}
            aria-describedby={describedBy}
            aria-invalid={!!error}
            {...props}
          />
          {trailingIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {trailingIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={errorId} className="mt-2 text-sm text-danger" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p id={hintId} className="mt-2 text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };