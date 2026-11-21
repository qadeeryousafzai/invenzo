"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
}

const sizeClasses = {
  xs: "h-7 w-7 text-[0.625rem]",
  sm: "h-9 w-9 text-[0.75rem]",
  md: "h-11 w-11 text-sm",
  lg: "h-13 w-13 text-base",
  xl: "h-17 w-17 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", src, alt, fallback, children, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    if (src && !imageError) {
      return (
        <div
          ref={ref}
          className={cn("clay-avatar relative overflow-hidden", sizeClasses[size], className)}
          {...props}
        >
          <img
            src={src}
            alt={alt || ""}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
          {fallback && (
            <div className="absolute inset-0 clay-avatar-fallback" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              {fallback}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn("clay-avatar clay-avatar-fallback", sizeClasses[size], className)}
        {...props}
      >
        {fallback ?? children ?? alt?.slice(0, 2).toUpperCase() ?? "?"}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}
const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={cn("clay-avatar-fallback", className)} {...props}>{children}</span>
  )
);
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarFallback };