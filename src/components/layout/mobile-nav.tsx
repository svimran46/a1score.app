"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Search, Settings, Star, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

/** Bottom navigation for phones (Section 9). */
export function MobileNav() {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Matches", icon: Flame, exact: true },
    { href: "/leagues", label: "Leagues", icon: Trophy, exact: false },
    { href: "/search", label: "Search", icon: Search, exact: false },
    { href: "/favorites", label: "Favs", icon: Star, exact: false },
    { href: "/settings", label: "Settings", icon: Settings, exact: false },
  ] as const;

  return (
    <nav
      aria-label="Primary mobile"
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-2xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
