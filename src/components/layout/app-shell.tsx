import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

/**
 * App shell: sticky header, main content, mobile bottom nav. A skip link
 * gives keyboard users fast access to content.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="focus:bg-background sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:border focus:px-3 focus:py-1.5 focus:text-sm"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-3 pt-3 pb-16 md:px-4 md:pb-8">
        {children}
        <footer className="mt-10 border-t pt-4 pb-4 text-center text-xs text-muted-foreground md:pb-0">
          Data by API-Football · LiveScore is an independent project and is not affiliated with any club or league.
        </footer>
      </main>
      <MobileNav />
    </div>
  );
}
