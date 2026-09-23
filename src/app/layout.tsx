import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "LiveScore — football live scores, standings & stats",
    template: "%s · LiveScore",
  },
  description:
    "Live football scores, league tables, fixtures, lineups and stats — updated in real time.",
  applicationName: "LiveScore",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1a12" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
