import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE_URL } from "@/lib/metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "a1score.app — Money meets the pitch",
    template: "%s",
  },
  description:
    "Football intelligence platform combining real-time match center delivery with player market valuations, career trajectories, and squad analytics on a1score.app.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "a1score.app",
    title: "a1score.app — Money meets the pitch",
    description:
      "Football intelligence: live match centers, player market valuations, career trajectories, and squad analytics.",
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
      "Football intelligence: live match centers, player market valuations, career trajectories, and squad analytics.",
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
  icons: {
    icon: "/favicon.ico",
  },
};

import { GridKeyNavigation } from "@/components/GridKeyNavigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'light') {
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
      <body className="bg-ink-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-ink-950 transition-colors duration-200">
        <GridKeyNavigation />
        <Navbar />
        <main className="app-container flex-1 pt-3 pb-20 sm:pb-8 sm:py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
