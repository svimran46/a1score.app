"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist/useWatchlist";

export interface FollowButtonProps {
  id: string;
  type: "player" | "club";
  name: string;
  slug?: string | null;
  avatarUrl?: string | null;
  clubName?: string | null;
  clubCrest?: string | null;
  position?: string | null;
  marketValue?: number | null;
  variant?: "icon" | "button";
  desktopHoverOnly?: boolean;
  className?: string;
}

export function FollowButton({
  id,
  type,
  name,
  slug,
  avatarUrl,
  clubName,
  clubCrest,
  position,
  marketValue,
  variant = "icon",
  desktopHoverOnly = false,
  className = "",
}: FollowButtonProps) {
  const { isMounted, isFollowing, toggle } = useWatchlist();
  const [isLoading, setIsLoading] = useState(false);

  // During SSR or pre-mount, render stable disabled state without layout shift
  const following = isMounted ? isFollowing(id, type) : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    toggle({
      id,
      type,
      name,
      slug: slug || undefined,
      avatarUrl,
      clubName,
      clubCrest,
      position,
      currentValueEur: marketValue || 0,
      initialValueEur: marketValue || 0,
    });

    if (!following && type === "player" && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("a1score:player-followed", {
          detail: { name, id, slug },
        })
      );
    }

    // Provide immediate optimistic feedback
    setTimeout(() => {
      setIsLoading(false);
    }, 100);
  };

  const label = following ? `Unfollow ${name}` : `Follow ${name}`;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-pressed={following}
        aria-label={label}
        className={`h-11 min-h-[44px] min-w-[44px] px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none ${
          following
            ? "bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-95"
            : "bg-[var(--bg-chip)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--divider)]"
        } ${isLoading ? "opacity-70 cursor-wait" : ""} ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
        ) : (
          <Star
            className={`w-4 h-4 shrink-0 transition-transform ${
              following ? "fill-current stroke-current" : "fill-none stroke-current"
            }`}
          />
        )}
        <span>{following ? "Following" : "Follow"}</span>
      </button>
    );
  }

  const hoverVisibilityClass =
    desktopHoverOnly && !following
      ? "md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100 md:group-focus-within:opacity-100"
      : "opacity-100";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={following}
      aria-label={label}
      title={label}
      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none ${
        following
          ? "text-[var(--accent)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
      } ${hoverVisibilityClass} ${isLoading ? "opacity-70 cursor-wait" : ""} ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[var(--text-muted)]" />
      ) : (
        <Star
          className={`w-4 h-4 shrink-0 transition-transform ${
            following
              ? "fill-[var(--accent)] stroke-[var(--accent)] scale-110"
              : "fill-none stroke-current"
          }`}
        />
      )}
    </button>
  );
}
