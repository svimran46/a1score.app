import React from "react";
import Image from "next/image";
import { NewsItem } from "@/types/news";
import { formatRelativeTime } from "@/lib/data/news";
import { ExternalLink, Newspaper } from "lucide-react";

interface NewsCardRowProps {
  item: NewsItem;
  className?: string;
}

/**
 * FotMob-style image-left news card row:
 * 96px thumbnail, 2-line headline, source and time in muted text.
 */
export function NewsCardRow({ item, className = "" }: NewsCardRowProps) {
  const relativeTime = formatRelativeTime(item.publishedAt);
  const primaryTag = item.entityTags?.[0]?.name || item.tags?.[0];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-3.5 p-3 sm:p-4 rounded-xl hover:bg-[var(--bg-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] select-none w-full ${className}`}
      aria-label={`Read story: ${item.title}`}
    >
      {/* 96px Fixed Thumbnail */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-24 rounded-xl bg-[var(--bg-elevated)] overflow-hidden shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            sizes="112px"
            loading="lazy"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-chip)]">
            <Newspaper className="w-7 h-7 opacity-30" />
          </div>
        )}
      </div>

      {/* Headline & Meta Content */}
      <div className="min-w-0 flex-1 flex flex-col justify-between self-stretch py-0.5">
        <div className="space-y-1">
          {primaryTag && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--value-text)] block truncate">
              {primaryTag}
            </span>
          )}
          <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] line-clamp-2 leading-snug transition-colors">
            {item.title}
          </h3>
        </div>

        {/* Source & Relative Time */}
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-1.5 pt-1">
          <span className="font-semibold text-[var(--text-secondary)]">{item.source}</span>
          <span>•</span>
          <span>{relativeTime}</span>
          <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-60 ml-auto shrink-0 group-hover:text-[var(--accent)] transition-colors" />
        </div>
      </div>
    </a>
  );
}
