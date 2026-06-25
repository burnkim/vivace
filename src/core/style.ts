import type { CSSProperties } from "react";
import type { Align, Justify, Style, Tokens } from "./types";

/**
 * Build a font-family stack. The Latin face is tried first; Korean glyphs fall
 * through to the document's Korean font (tokens.fonts.kr, if set) and then the
 * built-in KR fallbacks. This is what lets "Korean uses a different font" work:
 * Latin chars render in `fam`, Hangul renders in the KR override.
 */
export function cssFontStack(family: string | undefined, tokens: Tokens, role: "display" | "body" = "body"): string {
  const fam = family || (role === "display" ? tokens.fonts.display : tokens.fonts.body);
  const kr = tokens.fonts.kr;
  const krFallback = "'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR'";
  const generic = role === "display" ? "serif" : "sans-serif";
  // Body text is Korean-primary, so a Korean override must LEAD (otherwise a
  // Latin face that also ships Hangul — e.g. Pretendard — wins before the
  // override is reached). Display/Latin names keep the Latin face first and let
  // Korean fall through to the override.
  if (kr && role === "body") return `'${kr}', '${fam}', ${krFallback}, ${generic}`;
  const krOverride = kr ? `'${kr}', ` : "";
  return `'${fam}', ${krOverride}${krFallback}, ${generic}`;
}

const JUSTIFY_MAP: Record<Justify, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};
const ALIGN_MAP: Record<Align, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

function sizeValue(v: Style["width"], scale: number): string | number | undefined {
  if (v === undefined) return undefined;
  if (v === "auto") return "auto";
  if (v === "fill") return "100%";
  return v * scale;
}

/**
 * Resolve a block's style override into concrete inline CSS, scaled for the
 * target page (A4 = scale 1, A3 ≈ 1.36). Only properties present in the
 * override produce CSS — everything else falls back to inherited/token values.
 */
export function resolveStyle(style: Style | undefined, tokens: Tokens, scale: number): CSSProperties {
  const s = style ?? {};
  const css: CSSProperties = {};
  const px = (n: number) => n * scale;

  if (s.fontFamily) css.fontFamily = cssFontStack(s.fontFamily, tokens);
  if (s.fontSize != null) css.fontSize = px(s.fontSize);
  if (s.fontWeight != null) css.fontWeight = s.fontWeight;
  if (s.italic != null) css.fontStyle = s.italic ? "italic" : "normal";
  if (s.letterSpacing != null) css.letterSpacing = px(s.letterSpacing);
  if (s.lineHeight != null) css.lineHeight = s.lineHeight;
  if (s.textAlign) css.textAlign = s.textAlign;
  if (s.textTransform) css.textTransform = s.textTransform;
  if (s.color) css.color = s.color;

  if (s.marginTop != null) css.marginTop = px(s.marginTop);
  if (s.marginRight != null) css.marginRight = px(s.marginRight);
  if (s.marginBottom != null) css.marginBottom = px(s.marginBottom);
  if (s.marginLeft != null) css.marginLeft = px(s.marginLeft);
  if (s.paddingTop != null) css.paddingTop = px(s.paddingTop);
  if (s.paddingRight != null) css.paddingRight = px(s.paddingRight);
  if (s.paddingBottom != null) css.paddingBottom = px(s.paddingBottom);
  if (s.paddingLeft != null) css.paddingLeft = px(s.paddingLeft);

  if (s.grow != null) css.flexGrow = s.grow;
  if (s.width != null) css.width = sizeValue(s.width, scale);
  if (s.height != null) css.height = sizeValue(s.height, scale);

  if (s.background) css.background = s.background;
  if (s.opacity != null) css.opacity = s.opacity;
  if (s.borderRadius != null) css.borderRadius = px(s.borderRadius);
  if (s.borderWidth != null && s.borderWidth > 0) {
    const color = s.borderColor ?? tokens.color.line;
    const w = `${px(s.borderWidth)}px solid ${color}`;
    if (s.borderSides && s.borderSides.length) {
      for (const side of s.borderSides) {
        if (side === "top") css.borderTop = w;
        if (side === "right") css.borderRight = w;
        if (side === "bottom") css.borderBottom = w;
        if (side === "left") css.borderLeft = w;
      }
    } else {
      css.border = w;
    }
  }

  return css;
}

/** Layout CSS for a group block (flex or grid). */
export function resolveLayout(style: Style | undefined, scale: number): CSSProperties {
  const s = style ?? {};
  const css: CSSProperties = {};
  if (s.columns && s.columns > 1) {
    css.display = "grid";
    css.gridTemplateColumns = `repeat(${s.columns}, minmax(0, 1fr))`;
    css.gap = (s.gap ?? 0) * scale;
  } else {
    css.display = "flex";
    css.flexDirection = s.direction ?? "column";
    css.gap = (s.gap ?? 0) * scale;
    if (s.wrap) css.flexWrap = "wrap";
  }
  if (s.align) css.alignItems = ALIGN_MAP[s.align];
  if (s.justify) css.justifyContent = JUSTIFY_MAP[s.justify];
  return css;
}
