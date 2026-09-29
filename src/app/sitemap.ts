import { MetadataRoute } from "next";
import { getTopClubs } from "@/lib/data/clubs";
import { getMostValuablePlayers } from "@/lib/data/players";

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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://a1score.app";
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
      url: `${baseUrl}/players`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
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
      url: `${baseUrl}/methodology`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. League Competitions
  const leagueRoutes: MetadataRoute.Sitemap = TRACKED_LEAGUE_IDS.map((id) => ({
    url: `${baseUrl}/leagues/${id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  // 3. Dynamic Top Clubs
  let clubRoutes: MetadataRoute.Sitemap = [];
  try {
    const clubs = await getTopClubs(60);
    clubRoutes = clubs.map((c) => ({
      url: `${baseUrl}/clubs/${c.id}`,
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
      const slug = `${p.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${
        p.transfermarktId || p.id
      }`;
      return {
        url: `${baseUrl}/players/${slug}`,
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
