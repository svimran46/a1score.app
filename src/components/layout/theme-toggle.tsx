"use client";

import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsClient } from "@/lib/hooks/use-is-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Theme menu — light / dark / system. SSR-safe (icon mounts after hydration). */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          {mounted ? (
            <>
              <Sun className="dark:hidden" aria-hidden />
              <Moon className="hidden dark:block" aria-hidden />
            </>
          ) : (
            <Sun aria-hidden className="opacity-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          aria-current={mounted && theme === "light" ? "true" : undefined}
        >
          <Sun aria-hidden /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          aria-current={mounted && theme === "dark" ? "true" : undefined}
        >
          <Moon aria-hidden /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          aria-current={mounted && theme === "system" ? "true" : undefined}
        >
          <Laptop aria-hidden /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
