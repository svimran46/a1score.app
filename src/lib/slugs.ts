/**
 * Utility functions for human-readable SEO slugs across clubs, leagues, and players.
 */

export function slugify(text: string): string {
  if (!text) return "entity";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (e.g. München -> Munchen)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getClubSlug(club: { id: string; name: string }): string {
  const slug = slugify(club.name);
  return `${slug}-${club.id}`;
}

export function getLeagueSlug(league: { id: string; name: string }): string {
  const slug = slugify(league.name);
  return `${slug}-${league.id}`;
}

export function getPlayerSlug(player: { id: string; fullName?: string | null; commonName?: string | null }): string {
  const name = player.commonName || player.fullName || "player";
  const slug = slugify(name);
  return `${slug}-${player.id}`;
}

/**
 * Extracts the canonical CUID, Transfermarkt ID, or code from a slug parameter.
 */
export function extractIdentifierFromSlug(param: string): { cuid: string | null; tmId: string | null; raw: string } {
  const raw = (param || "").trim();
  const cuidMatch = raw.match(/c[a-z0-9]{24}/i);
  const cuid = cuidMatch ? cuidMatch[0] : null;

  // Numeric TM ID at the end or standalone
  const numMatch = raw.match(/\b\d+\b/);
  const tmId = numMatch ? numMatch[0] : null;

  return { cuid, tmId, raw };
}
