/**
 * Vivace menu design tokens.
 *
 * Single source of truth for every size in the menu. Authored ONCE at the
 * native A4 scale (the resolution the Figma frames were exported at, ~300 DPI,
 * A4 = 2480 x 3508 px). Every other format is derived by multiplying these
 * numbers by a `scale` factor — so A4 and A3 are literally the same design at
 * two sizes, which is the whole point of the "systemized" menu.
 *
 * A3 uses the scale factor measured from the original imports (header text
 * 84.033 -> 114.388 px, divider stroke 2.626 -> 3.575 px = 1.3612), NOT the
 * geometric A3/A4 ratio (1.414). The extra page space on A3 is absorbed by the
 * margins/gaps, matching the designer's intent.
 */

export type PaperSize = "a4" | "a3";

/** Font families (free substitutes — see styles/fonts.css). */
export const FONT_DISPLAY = "'Playfair Display', serif";
export const FONT_SANS = "'Inter', sans-serif";
export const FONT_KR = "'Noto Sans KR', sans-serif";

/** True paper dimensions in millimetres (used for PDF page sizing). */
export const PAPER_MM: Record<PaperSize, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
};

/** Native pixel canvas per paper size (true mm @ 300 DPI). */
export const PAGE_PX: Record<PaperSize, { w: number; h: number }> = {
  a4: { w: 2480, h: 3508 },
  a3: { w: 3508, h: 4961 },
};

/** Content scale per paper size. A4 native = 1. */
export const SCALE: Record<PaperSize, number> = {
  a4: 1,
  a3: 1.3612,
};

/** DPI the native px canvas represents (used to convert px <-> mm for export). */
export const NATIVE_DPI = 300;

/** Base token set, authored at A4 native scale (scale = 1), values in px. */
const BASE = {
  font: {
    sectionTitle: 84,
    sectionSub: 47,
    blendTitle: 66,
    blendBody: 40,
    itemNameEn: 40,
    itemNameKr: 30,
    itemPrice: 40,
    itemPriceNote: 18,
    itemDesc: 24,
    note: 38,
    badge: 19,
    // Hand drip (filter coffee) specific
    beanNameEn: 42,
    beanGrade: 26,
    beanPrice: 44,
    headCopy: 30,
    beanDesc: 26,
  },
  /** Negative letter-spacing applied to display serif text (px). */
  tracking: {
    title: -1.68,
    body: -1.2,
  },
  space: {
    pagePadX: 150,
    pagePadY: 170,
    columnGap: 56,
    sectionGap: 72,
    itemGap: 30,
    headerGap: 26,
    blendGap: 16,
    beanGap: 44,
    rowGap: 8,
  },
  stroke: 2.626,
  badge: {
    padX: 24,
    padY: 6,
    radius: 999,
  },
} as const;

export type MenuTokens = {
  font: Record<keyof typeof BASE.font, number>;
  tracking: Record<keyof typeof BASE.tracking, number>;
  space: Record<keyof typeof BASE.space, number>;
  stroke: number;
  badge: { padX: number; padY: number; radius: number };
};

function scaleRecord<T extends Record<string, number>>(rec: T, s: number): T {
  const out = {} as Record<string, number>;
  for (const k in rec) out[k] = rec[k] * s;
  return out as T;
}

/** Returns the full token set scaled by `s`. */
export function tokensForScale(s: number): MenuTokens {
  return {
    font: scaleRecord(BASE.font, s),
    tracking: scaleRecord(BASE.tracking, s),
    space: scaleRecord(BASE.space, s),
    stroke: BASE.stroke * s,
    badge: {
      padX: BASE.badge.padX * s,
      padY: BASE.badge.padY * s,
      radius: BASE.badge.radius,
    },
  };
}
