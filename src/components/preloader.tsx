"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/logo";

/**
 * Site preloader shown on first paint.
 *
 * A bouncing ball with live 0-100% counter and a filling progress bar.
 * Counts up fast, then fades out to reveal the page.
 */
export function Preloader() {
  const [progress, setProgress] = useState(0);
  const [hidden, setHidden] = useState(false);
  const frame = useRef<number | null>(null);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const duration = 1500; // ms for the count-up

    const tick = (now: number) => {
      if (start.current === null) start.current = now;
      const elapsed = now - start.current;
      const ratio = Math.min(elapsed / duration, 1);
      // easeOutCubic for a fast, snappy count
      const eased = 1 - Math.pow(1 - ratio, 3);
      setProgress(Math.round(eased * 100));
      if (ratio < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        window.setTimeout(() => setHidden(true), 350);
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      className={hidden ? "preloader is-hidden" : "preloader"}
      aria-live="polite"
      aria-busy={!hidden}
      aria-hidden={hidden}
    >
      <div className="preloader__glow" aria-hidden="true" />
      <div className="preloader__stage">
        <div className="preloader__balls" aria-hidden="true">
          <span className="preloader__ball preloader__ball--1" />
          <span className="preloader__ball preloader__ball--2" />
          <span className="preloader__ball preloader__ball--3" />
        </div>

        <div className="preloader__logo" aria-hidden="true">
          <LogoMark size={64} />
        </div>

        <div className="preloader__brand" aria-hidden="true">
          {"INVENZO".split("").map((letter, i) => (
            <span
              key={i}
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        <div className="preloader__footer" aria-hidden="true">
          <div className="preloader__bar">
            <span
              className="preloader__bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="preloader__percent">{progress}%</span>
        </div>
      </div>
      <span className="sr-only">Loading Invenzo</span>
    </div>
  );
}