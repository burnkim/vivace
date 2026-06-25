/**
 * Google Fonts registry + dynamic loader for user-selectable menu fonts.
 *
 * Korean glyphs always fall back to Noto Sans KR / Noto Serif KR (loaded in
 * styles/fonts.css), so a Latin-only display font still renders Korean text.
 */

export type FontType = "serif" | "sans";

export type FontOption = { name: string; type: FontType };

/** Curated open Google fonts — split so the picker can group serif vs sans. */
export const GOOGLE_FONTS: FontOption[] = [
  // Serif / display
  { name: "Playfair Display", type: "serif" },
  { name: "Cormorant Garamond", type: "serif" },
  { name: "EB Garamond", type: "serif" },
  { name: "Libre Baskerville", type: "serif" },
  { name: "Lora", type: "serif" },
  { name: "Noto Serif", type: "serif" },
  { name: "Bodoni Moda", type: "serif" },
  { name: "Spectral", type: "serif" },
  { name: "Noto Serif KR", type: "serif" },
  { name: "Nanum Myeongjo", type: "serif" },
  { name: "Gowun Batang", type: "serif" },
  // Sans
  { name: "Inter", type: "sans" },
  { name: "Montserrat", type: "sans" },
  { name: "Poppins", type: "sans" },
  { name: "Work Sans", type: "sans" },
  { name: "Raleway", type: "sans" },
  { name: "Noto Sans", type: "sans" },
  { name: "Noto Sans KR", type: "sans" },
  { name: "Gowun Dodum", type: "sans" },
];

const ALWAYS_AVAILABLE = new Set(["Playfair Display", "Inter", "Noto Sans KR", "Noto Serif KR"]);
const loaded = new Set<string>(ALWAYS_AVAILABLE);

/** Injects a <link> for a Google font once (no-op for already-loaded fonts). */
export function ensureFontLoaded(name?: string): void {
  if (!name || loaded.has(name) || typeof document === "undefined") return;
  loaded.add(name);
  const linkId = `gf-${name.replace(/\s+/g, "-")}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  // No axis spec: returns whatever weights/instances the family ships, which
  // avoids 400s from requesting unavailable weights.
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, "+")}&display=swap`;
  document.head.appendChild(link);
}

/** Builds a CSS font-family string with Korean + generic fallbacks. */
export function cssFamily(name: string, type: FontType): string {
  const kr = type === "serif" ? "'Noto Serif KR'" : "'Noto Sans KR'";
  const generic = type === "serif" ? "serif" : "sans-serif";
  return `'${name}', ${kr}, ${generic}`;
}

/** Best-effort type guess used for fallback selection. */
export function fontType(name: string): FontType {
  return GOOGLE_FONTS.find((f) => f.name === name)?.type ?? "sans";
}
