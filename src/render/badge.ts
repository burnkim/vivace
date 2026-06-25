import type { CSSProperties } from "react";
import type { BadgeDef } from "../core/types";

/** A toothed "seal" outline as a clip-path polygon (cog/sawtooth circle). */
export function sawtoothClip(teeth = 11, inner = 0.78): string {
  const pts: string[] = [];
  const n = teeth * 2;
  for (let i = 0; i < n; i++) {
    const r = i % 2 === 0 ? 50 : 50 * inner;
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

/**
 * The complete visual style for a badge (background, border, shape). Shared by
 * the page renderer (BadgeView) and the settings preview swatch so they NEVER
 * drift — change the shape once and every place that draws the badge agrees.
 * `px` scales design px to the target context; `fontSize` is set by the caller.
 *
 * `alignSelf: center` keeps the badge vertically centered on its neighbouring
 * text in EVERY flex context (titles use alignItems:center, item rows use
 * alignItems:baseline) so badges never sag to the text baseline.
 */
export function badgeStyle(b: BadgeDef, px: (n: number) => number): CSSProperties {
  const outline = b.shape === "outline";
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    fontWeight: 600,
    lineHeight: 1.3,
    fontFamily: "Pretendard, sans-serif",
    whiteSpace: "nowrap",
    background: outline ? "transparent" : b.bg,
    color: b.fg,
    border: outline ? `${px(1.5)}px solid ${b.fg}` : "none",
    verticalAlign: "middle",
  };
  if (b.shape === "sawtooth") {
    const clip = sawtoothClip();
    style.padding = `${px(9)}px ${px(20)}px`;
    style.clipPath = clip;
    style.WebkitClipPath = clip;
    style.borderRadius = 0;
  } else {
    style.padding = `${px(5)}px ${px(15)}px`;
    style.borderRadius = b.shape === "ellipse" ? "50%" : b.shape === "pill" ? 999 : px(4);
  }
  return style;
}
