import type { PaperSize, Tokens } from "./types";

/** True paper sizes in millimetres. */
export const PAPER_MM: Record<Exclude<PaperSize, "custom">, { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  a5: { w: 148, h: 210 },
};

/** Native px canvas @ 300 DPI for crisp PDF capture. */
export const DPI = 300;
export const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

/** Default content scale per paper, relative to A4 base tokens. Geometric A3/A4
    ratio (√2) so an A4 layout enlarges PROPORTIONALLY onto A3 — margins, padding,
    images and type all scale at the same rate as the page. */
export const PAPER_SCALE: Record<Exclude<PaperSize, "custom">, number> = {
  a4: 1,
  a3: 1.4142,
  a5: 0.7071,
};

/** Authoring defaults (A4 native, px). Documents start from these tokens. */
export const DEFAULT_TOKENS: Tokens = {
  fonts: { display: "Playfair Display", body: "Pretendard" },
  color: { ink: "#111111", muted: "#6b6b6b", line: "#111111", paper: "#ffffff" },
  font: {
    wordmark: 150,
    sectionTitle: 70,
    sectionSub: 30,
    itemNameEn: 40,
    itemNameKr: 28,
    itemPrice: 46,
    itemPriceNote: 20,
    itemDesc: 26,
    note: 24,
    beanNameEn: 42,
    beanGrade: 26,
    beanPrice: 46,
    headCopy: 30,
    beanDesc: 26,
    text: 28,
  },
  tracking: { title: -1.5, body: -0.5 },
  space: { sectionGap: 64, itemGap: 28, columnGap: 90, headerGap: 28 },
  stroke: 2.6,
  beanCopyWidth: 66,
};

export function pageMm(
  paper: PaperSize,
  orientation: "portrait" | "landscape",
  custom?: { widthMm?: number; heightMm?: number },
): { w: number; h: number } {
  const base =
    paper === "custom"
      ? { w: custom?.widthMm ?? 210, h: custom?.heightMm ?? 297 }
      : PAPER_MM[paper];
  return orientation === "landscape" ? { w: base.h, h: base.w } : base;
}
