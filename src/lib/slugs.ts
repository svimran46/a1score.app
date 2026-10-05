/**
 * Utility functions for human-readable SEO slugs across clubs, leagues, and players.
 */

const TRANSLITERATION_MAP: Record<string, string> = {
  "\u00f8": "o", "\u00d8": "o", // ø, Ø
  "\u0142": "l", "\u0141": "l", // ł, Ł
  "\u0111": "d", "\u0110": "d", // đ, Đ
  "\u00df": "ss",               // ß
  "\u00e6": "ae", "\u00c6": "ae", // æ, Æ
  "\u0153": "oe", "\u0152": "oe", // œ, Œ
  "\u00fe": "th", "\u00de": "th", // þ, Þ
  "\u00f0": "d",  "\u00d0": "d",  // ð, Ð
};

export function slugify(text: string): string {
  if (!text) return "entity";

  let str = text;
  for (const [char, replacement] of Object.entries(TRANSLITERATION_MAP)) {
    str = str.replaceAll(char, replacement);
  }

  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/['’]/g, "-")          // apostrophes to hyphens
    .replace(/[^a-z0-9]+/g, "-")    // non-alphanumeric to hyphens
    .replace(/-+/g, "-")            // eliminate duplicate hyphens
    .replace(/^-+|-+$/g, "");       // strip leading and trailing hyphens
}

export function getClubSlug(club: { id: string; name: string }): string {
  const slug = slugify(club.name);
  return `${slug}-${club.id}`;
}

export function getLeagueSlug(league: { id: string; name: string }): string {
  const slug = slugify(league.name);
  return `${slug}-${league.id}`;
}

export function getPlayerSlug(player: {
  id?: string;
  fullName?: string | null;
  commonName?: string | null;
  transfermarktId?: string | number | null;
}): string {
  const name = player.commonName || player.fullName || "player";
  const slug = slugify(name);
  const extId = player.transfermarktId || player.id || "0";
  return `${slug}-${extId}`;
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
