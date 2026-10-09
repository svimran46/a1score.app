"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[var(--bg-page)] text-text-primary min-h-screen flex flex-col font-sans antialiased">
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-trend-down/10 border border-trend-down/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-trend-down"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Critical Error
            </h1>
            <p className="text-sm text-text-muted max-w-md">
              Something went seriously wrong. Please try refreshing the page.
            </p>
          </div>

          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-accent text-[var(--accent-contrast)] text-sm font-bold hover:bg-accent transition-colors"
          >
            Refresh Page
          </button>
        </main>
      </body>
    </html>
  );
}
