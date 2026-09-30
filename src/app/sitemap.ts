import { MetadataRoute } from "next";
import { getTopClubs } from "@/lib/data/clubs";
import { getMostValuablePlayers } from "@/lib/data/players";
import { SITE_URL } from "@/lib/metadata";
import { getClubSlug, getLeagueSlug } from "@/lib/slugs";

export const runtime = "edge";
export const revalidate = 86400; // Cache sitemap for 24 hours

const TRACKED_LEAGUES = [
  { name: "Premier League", id: "cmuihndux0003b23fizizm4a0" },
  { name: "LaLiga", id: "cmuihnet00007b23f2qf4z79i" },
  { name: "Serie A", id: "cmuihnf000008b23fghk99r1h" },
  { name: "Bundesliga", id: "cmuihnfps0009b23fe6s9s949" },
  { name: "Ligue 1", id: "cmuihnggh000ab23ftw5z9a34" },
  { name: "Liga Portugal", id: "cmuihnh71000bb23f7w76a380" },
  { name: "Eredivisie", id: "cmuihnhvo000cb23f1m06d5s7" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/matches`,
      lastModified: now,
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/players`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/values`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/clubs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/leagues`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // 2. League Competitions (Readable Slugs)
  const leagueRoutes: MetadataRoute.Sitemap = TRACKED_LEAGUES.map((l) => ({
    url: `${SITE_URL}/leagues/${getLeagueSlug(l)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic Top Clubs (Readable Slugs)
  let clubRoutes: MetadataRoute.Sitemap = [];
  try {
    const clubs = await getTopClubs(100);
    clubRoutes = clubs.map((c) => ({
      url: `${SITE_URL}/clubs/${getClubSlug(c)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch top clubs for sitemap:", err);
  }

  // 4. Dynamic Most Valuable Players (Readable Slugs)
  let playerRoutes: MetadataRoute.Sitemap = [];
  try {
    const players = await getMostValuablePlayers(120);
    playerRoutes = players.map((p) => {
      const slug = p.slug || `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${p.sourceId || p.id}`;
      return {
        url: `${SITE_URL}/players/${slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch top players for sitemap:", err);
  }

  return [...staticRoutes, ...leagueRoutes, ...clubRoutes, ...playerRoutes];
}
