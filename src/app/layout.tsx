import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Invenzo — Pharmacy Management", template: "%s · Invenzo" },
  description: "Pharmacy inventory and point of sale workspace.",
  appleWebApp: { capable: true, title: "Invenzo", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full bg-white text-black">
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <Toaster />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
