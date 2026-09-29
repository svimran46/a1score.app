import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a1score.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "a1score.app — Money meets the pitch",
    template: "%s | a1score.app",
  },
  description:
    "Football intelligence platform combining real-time match center delivery with player market valuations, career trajectories, and squad analytics on a1score.app.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "a1score.app",
    title: "a1score.app — Money meets the pitch",
    description:
      "Football intelligence: live match centers, player market valuations, career trajectories, and squad analytics.",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
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
    images: [`${siteUrl}/og-default.png`],
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
    canonical: siteUrl,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

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
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
