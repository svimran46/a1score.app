import { MetadataRoute } from "next";
import { getAllClubs } from "@/lib/data/clubs";
import { supabase } from "@/lib/supabase";
import { getEffectiveSiteUrl } from "@/lib/metadata";
import { getClubSlug, getLeagueSlug } from "@/lib/slugs";

export const runtime = "edge";
export const revalidate = 86400; // Cache sitemap for 24 hours

const TRACKED_LEAGUES = [
  { name: "Premier League", id: "cmuihndux0003b23fizizm4a0" },
  { name: "LaLiga", id: "cmuihncv70001b23frvqgzdp6" },
  { name: "Serie A", id: "cmuihnegb0004b23fhslrse6b" },
  { name: "Bundesliga", id: "cmuihneym0005b23fkpqbo0uj" },
  { name: "Ligue 1", id: "cmuihnddf0002b23fskdzdx29" },
  { name: "Liga Portugal", id: "cmuihnfy10007b23f3j6km8jo" },
  { name: "Eredivisie", id: "cmuihnffm0006b23feq78bq1b" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getEffectiveSiteUrl();
  const now = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/matches`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/values`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/clubs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leagues`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/news`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/transfers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 2. League Competitions (Readable Slugs)
  const leagueRoutes: MetadataRoute.Sitemap = TRACKED_LEAGUES.map((l) => ({
    url: `${baseUrl}/leagues/${getLeagueSlug(l)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic All Public Clubs (Readable Slugs)
  let clubRoutes: MetadataRoute.Sitemap = [];
  try {
    const clubs = await getAllClubs({ all: true });
    if (clubs && clubs.length > 0) {
      clubRoutes = clubs.map((c: any) => ({
        url: `${baseUrl}/clubs/${getClubSlug(c)}`,
        lastModified: c.lastSyncedAt ? new Date(c.lastSyncedAt) : now,
        changeFrequency: "weekly",
        priority: 0.75,
      }));
    }
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch clubs for sitemap:", err);
  }

  // 4. Dynamic Public Players (Readable Slugs)
  let playerRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data: dbPlayers } = await supabase
      .from("Player")
      .select("id, fullName, transfermarktId, updatedAt")
      .not("latestMarketValue", "is", null)
      .order("latestMarketValue", { ascending: false, nullsFirst: false })
      .limit(10000);

    if (dbPlayers && dbPlayers.length > 0) {
      playerRoutes = dbPlayers.map((p: any) => {
        const extId = p.transfermarktId || p.id;
        const slug = `${(p.fullName || "player").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${extId}`;
        return {
          url: `${baseUrl}/players/${slug}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
          changeFrequency: "weekly",
          priority: 0.7,
        };
      });
    }
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch players for sitemap:", err);
  }

  return [...staticRoutes, ...leagueRoutes, ...clubRoutes, ...playerRoutes];
}
