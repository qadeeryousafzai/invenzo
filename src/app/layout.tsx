import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Invenzo — Smarter Inventory. Greater Control.", template: "%s · Invenzo" },
  description: "A secure workspace for modern inventory teams.",
  appleWebApp: { capable: true, title: "Invenzo", statusBarStyle: "default" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full"><ThemeProvider attribute="class" defaultTheme="system" enableSystem><Toaster />{children}</ThemeProvider></body>
    </html>
  );
}
