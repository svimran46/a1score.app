import { MetadataRoute } from "next";
import { getTopClubs } from "@/lib/data/clubs";
import { getMostValuablePlayers } from "@/lib/data/players";
import { SITE_URL } from "@/lib/metadata";

export const runtime = "edge";
export const revalidate = 86400; // Cache sitemap for 24 hours

const TRACKED_LEAGUE_IDS = [
  "GB1", // Premier League
  "ES1", // La Liga
  "IT1", // Serie A
  "L1",  // Bundesliga
  "FR1", // Ligue 1
  "NL1", // Eredivisie
  "PO1", // Liga Portugal
  "CL",  // UEFA Champions League
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
      priority: 0.8,
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
  ];

  // 2. League Competitions
  const leagueRoutes: MetadataRoute.Sitemap = TRACKED_LEAGUE_IDS.map((id) => ({
    url: `${SITE_URL}/leagues/${id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic Top Clubs
  let clubRoutes: MetadataRoute.Sitemap = [];
  try {
    const clubs = await getTopClubs(60);
    clubRoutes = clubs.map((c) => ({
      url: `${SITE_URL}/clubs/${c.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));
  } catch (err) {
    console.warn("[Sitemap] Failed to fetch top clubs for sitemap:", err);
  }

  // 4. Dynamic Most Valuable Players
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
