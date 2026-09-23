"use client";

import { useTheme } from "next-themes";
import { Laptop, Moon, Sun, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFavoritesHydrated } from "@/lib/hooks/use-favorites";
import { useIsClient } from "@/lib/hooks/use-is-client";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";

/**
 * Settings (Section 8.9): theme (light/dark/system) and clear favorites.
 * Note the shared-key architecture: there is no per-visitor API key —
 * the server holds one key shared by all visitors (Section 2).
 */
export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const clear = useFavorites((s) => s.clear);
  const favorites = useFavoritesHydrated();
  const mounted = useIsClient();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Follows your system by default.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="radiogroup" aria-label="Theme" className="flex flex-wrap gap-2">
            {(
              [
                { key: "light", label: "Light", icon: Sun },
                { key: "dark", label: "Dark", icon: Moon },
                { key: "system", label: "System", icon: Laptop },
              ] as const
            ).map((option) => {
              const active = mounted && theme === option.key;
              return (
                <button
                  key={option.key}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(option.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    active
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  <option.icon aria-hidden className="size-4" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Favorites</CardTitle>
          <CardDescription>
            Stored in this browser only — there are no accounts in this build.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {favorites.length} saved {favorites.length === 1 ? "item" : "items"}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => clear()}
            disabled={favorites.length === 0}
          >
            <Trash2 aria-hidden />
            Clear favorites
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About data &amp; quota</CardTitle>
          <CardDescription>
            This site fetches from API-Football through its own server with one shared key.
            There is no per-visitor key or plan setting — caching keeps usage low for everyone.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
