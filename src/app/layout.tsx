import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Preloader } from "@/components/preloader";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Invenzo — Pharmacy Management", template: "%s · Invenzo" },
  description: "Pharmacy inventory and point of sale workspace.",
  icons: {
    icon: [
      { url: "/logo/Favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/logo/Favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/Favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: [{ url: "/logo/Favicon.png", type: "image/png" }],
    apple: [{ url: "/logo/pwa-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Invenzo", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <Preloader />
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
