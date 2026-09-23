"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Search, Star, Trophy } from "lucide-react";

import { TeamLogo } from "@/components/shared/team-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Matches", icon: Flame, exact: true },
  { href: "/leagues", label: "Leagues", icon: Trophy, exact: false },
  { href: "/favorites", label: "Favorites", icon: Star, exact: false },
] as const;

/** Sticky top nav — desktop links, mobile keeps a bottom nav + search icon. */
export function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="flex items-center gap-2 rounded-md pr-2 font-bold tracking-tight">
          <TeamLogo src={null} alt="L" size={26} className="bg-primary text-primary-foreground" />
          <span className="text-lg">
            LiveScore<span className="text-primary">.</span>
          </span>
          <span className="sr-only">LiveScore — football scores</span>
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild aria-label="Search teams and leagues">
            <Link href="/search">
              <Search aria-hidden />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
