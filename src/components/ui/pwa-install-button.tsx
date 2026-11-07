"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeToInstalledChanges(onChange: () => void) {
  const displayMode = window.matchMedia("(display-mode: standalone)");
  displayMode.addEventListener("change", onChange);
  window.addEventListener("appinstalled", onChange);
  return () => {
    displayMode.removeEventListener("change", onChange);
    window.removeEventListener("appinstalled", onChange);
  };
}

function isAppInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const installed = useSyncExternalStore(subscribeToInstalledChanges, isAppInstalled, () => false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  async function installApp() {
    if (!installPrompt) {
      setShowHelp((visible) => !visible);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowHelp(false);
  }

  if (installed) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={installApp}
        aria-expanded={showHelp}
        aria-describedby={showHelp ? "install-help" : undefined}
        className="install-button"
      >
        <Download size={15} />
        <span>Install app</span>
      </button>
      {showHelp && (
        <p id="install-help" role="status" className="install-help">
          {/iphone|ipad|ipod/i.test(navigator.userAgent)
            ? "In Safari, tap Share, then Add to Home Screen."
            : "Choose Install app or Add to Home Screen from your browser menu."}
        </p>
      )}
    </div>
  );
}
