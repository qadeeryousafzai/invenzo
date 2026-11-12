import { cn } from "@/lib/utils";

type LogoMarkProps = {
  size?: number;
  className?: string;
};

/**
 * Invenzo logo mark — a stylized cube with an "i" cutout,
 * representing inventory + intelligence.
 */
export function LogoMark({ size = 28, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" />
          <stop offset="0.5" stopColor="#0f766e" />
          <stop offset="1" stopColor="#134e4a" />
        </linearGradient>
      </defs>
      {/* Cube body */}
      <path
        d="M24 2 4 13v22l20 11 20-11V13L24 2Z"
        fill="url(#logo-grad)"
      />
      {/* Cube top face highlight */}
      <path
        d="M24 2 4 13l20 11 20-11L24 2Z"
        fill="#14b8a6"
        fillOpacity="0.35"
      />
      {/* "i" — dot */}
      <circle cx="24" cy="17" r="3.5" fill="white" />
      {/* "i" — stem */}
      <rect x="20.5" y="23" width="7" height="14" rx="3.5" fill="white" />
    </svg>
  );
}

type LogoFullProps = {
  size?: number;
  className?: string;
  textClassName?: string;
  showDot?: boolean;
};

/**
 * Full Invenzo wordmark with logo mark + text.
 */
export function LogoFull({ size = 28, className, textClassName, showDot = true }: LogoFullProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span
        className={cn(
          "font-bold tracking-tight text-slate-950",
          textClassName,
        )}
      >
        invenzo{showDot && <span className="text-emerald-500">.</span>}
      </span>
    </span>
  );
}