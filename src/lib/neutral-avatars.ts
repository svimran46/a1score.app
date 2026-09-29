/**
 * Neutral high-performance SVG fallbacks for players, clubs, and leagues.
 * Styled with our ink black and warm amber design tokens.
 */

export const NEUTRAL_PLAYER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#090a0f"/>
  <circle cx="64" cy="48" r="22" fill="#1e293b"/>
  <path d="M28 106c0-19.882 16.118-36 36-36s36 16.118 36 36" fill="#1e293b"/>
  <circle cx="64" cy="48" r="20" fill="#334155"/>
  <path d="M32 106c0-17.673 14.327-32 32-32s32 14.327 32 32" fill="#334155"/>
</svg>`;

export const NEUTRAL_CLUB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#090a0f"/>
  <path d="M64 24L32 38v34c0 24.5 13.7 47.4 32 54 18.3-6.6 32-29.5 32-54V38L64 24z" fill="#1e293b" stroke="#334155" stroke-width="3"/>
  <path d="M64 36L42 46v24c0 17 9.5 33 22 38 12.5-5 22-21 22-38V46L64 36z" fill="#0f172a"/>
  <circle cx="64" cy="64" r="10" fill="#f59e0b" opacity="0.8"/>
</svg>`;

export const NEUTRAL_LEAGUE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="24" fill="#090a0f"/>
  <path d="M44 32h40v30c0 11-9 20-20 20s-20-9-20-20V32z" fill="#1e293b" stroke="#334155" stroke-width="3"/>
  <path d="M34 38h10v16H34c-4.4 0-8-3.6-8-8s3.6-8 8-8zM94 38h-10v16h10c4.4 0 8-3.6 8-8s-3.6-8-8-8z" fill="#1e293b"/>
  <path d="M60 82h8v18h-8zM48 100h32v8H48z" fill="#f59e0b"/>
</svg>`;
