"use client";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useIsFavorite } from "@/lib/hooks/use-favorites";
import { useFavorites } from "@/lib/store/favorites";
import { cn } from "@/lib/utils";

/**
 * Favorite toggle for a team or league (Section 8.8). Persisted to
 * localStorage via the Zustand store; no account system in this build.
 */
export function FavoriteButton({
  kind,
  id,
  name,
  logoUrl,
}: {
  kind: "team" | "league";
  id: number;
  name: string;
  logoUrl: string | null;
}) {
  const isFavorite = useIsFavorite(kind, id);
  const toggle = useFavorites((s) => s.toggle);

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isFavorite ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
      aria-pressed={isFavorite}
      onClick={() => toggle({ kind, id, name, logoUrl })}
      className={cn(isFavorite && "border-primary/50 text-primary")}
    >
      <Star aria-hidden className={cn("size-4", isFavorite && "fill-primary text-primary")} />
    </Button>
  );
}
