import React from "react";
import Link from "next/link";
import Image from "next/image";
import { NewsItem } from "@/types/news";
import { formatRelativeTime } from "@/lib/data/news";
import { ExternalLink, Newspaper } from "lucide-react";
import { Card } from "@/components/ui";

interface NewsCardHeroProps {
  item: NewsItem;
  className?: string;
}

export function NewsCardHero({ item, className = "" }: NewsCardHeroProps) {
  const relativeTime = formatRelativeTime(item.publishedAt);

  return (
    <Card className={`p-0 overflow-hidden group ${className}`}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] rounded-[var(--card-radius)]"
        aria-label={`Read story: ${item.title}`}
      >
        {/* Large Media Banner */}
        <div className="relative w-full h-52 sm:h-72 md:h-80 bg-[var(--bg-elevated)] overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-chip)]">
              <Newspaper className="w-12 h-12 opacity-30" />
            </div>
          )}

          {/* Source badge overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md text-[11px] font-bold text-[var(--text-primary)] shadow-sm">
            <span>{item.source}</span>
            <span>•</span>
            <span className="text-[var(--text-muted)] font-medium">{relativeTime}</span>
          </div>
        </div>

        {/* Story Details */}
        <div className="p-4 sm:p-5 space-y-2">
          {/* Entity Tags */}
          {item.entityTags && item.entityTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {item.entityTags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--bg-chip)] text-[var(--value-text)]"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <h2 className="text-lg sm:text-2xl font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] tracking-tight leading-snug transition-colors">
            {item.title}
          </h2>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {item.snippet}
          </p>

          <div className="pt-2 flex items-center justify-between text-xs text-[var(--accent)] font-semibold">
            <span className="inline-flex items-center gap-1 group-hover:underline">
              Read original article <ExternalLink className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] text-[var(--text-muted)] font-normal">
              {item.source}
            </span>
          </div>
        </div>
      </a>
    </Card>
  );
}
