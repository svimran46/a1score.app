import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "a1score.app — Money meets the pitch",
    template: "%s",
  },
  description:
    "Football platform combining real-time scores with player market valuations and club records on a1score.app.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "a1score.app",
    title: "a1score.app — Money meets the pitch",
    description:
      "Football platform: live scores, player market valuations, and club records.",
    images: [
      {
        url: `${SITE_URL}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "a1score.app — Money meets the pitch",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "a1score.app — Money meets the pitch",
    description:
      "Football platform: live scores, player market valuations, and club records.",
    images: [`${SITE_URL}/og-default.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "a1score",
  },
};

import { GridKeyNavigation } from "@/components/GridKeyNavigation";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PostFollowNotificationPrompt } from "@/components/notifications/PostFollowNotificationPrompt";
import { AppShell } from "@/components/AppShell";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const t = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
                if (t === 'light') {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased transition-colors duration-200" style={{ backgroundColor: "var(--bg-page)", color: "var(--text-primary)", fontFamily: "var(--font-sans)" }}>
        <ServiceWorkerRegister />
        <GridKeyNavigation />
        <PostFollowNotificationPrompt />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
