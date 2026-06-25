import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  PaperSize,
  PAGE_PX,
  SCALE,
  tokensForScale,
  type MenuTokens,
} from "./tokens";
import { cssFamily, ensureFontLoaded, fontType } from "./fonts";
import type { StyleConfig } from "../data/menu-types";

type Fonts = { title: string; body: string };

type ScaleValue = {
  paper: PaperSize;
  scale: number;
  tokens: MenuTokens;
  pageWidthPx: number;
  pageHeightPx: number;
  fonts: Fonts;
  /** Description line-height multiplier (from style config). */
  lineHeight: number;
};

const ScaleContext = createContext<ScaleValue | null>(null);

/**
 * Provides scaled tokens + resolved fonts for everything rendered beneath it.
 * `style` (gaps, fonts, line-height) overrides the base tokens so the editor's
 * style controls flow into every menu component.
 */
export function ScaleProvider({
  paper,
  style,
  children,
}: {
  paper: PaperSize;
  style?: StyleConfig;
  children: ReactNode;
}) {
  const value = useMemo<ScaleValue>(() => {
    const scale = SCALE[paper];
    const tokens = tokensForScale(scale);
    if (style) {
      tokens.space.sectionGap = style.groupGap * scale;
      tokens.space.itemGap = style.itemGap * scale;
      // Optional margin / column controls (older docs may omit these).
      if (style.pagePadX != null) tokens.space.pagePadX = style.pagePadX * scale;
      if (style.pagePadY != null) tokens.space.pagePadY = style.pagePadY * scale;
      if (style.columnGap != null) tokens.space.columnGap = style.columnGap * scale;
      ensureFontLoaded(style.titleFont);
      ensureFontLoaded(style.bodyFont);
    }
    const fonts: Fonts = style
      ? {
          title: cssFamily(style.titleFont, fontType(style.titleFont)),
          body: cssFamily(style.bodyFont, fontType(style.bodyFont)),
        }
      : { title: cssFamily("Playfair Display", "serif"), body: cssFamily("Noto Sans KR", "sans") };

    return {
      paper,
      scale,
      tokens,
      pageWidthPx: PAGE_PX[paper].w,
      pageHeightPx: PAGE_PX[paper].h,
      fonts,
      lineHeight: style?.lineHeight ?? 1.4,
    };
  }, [paper, style]);

  return <ScaleContext.Provider value={value}>{children}</ScaleContext.Provider>;
}

export function useScale(): ScaleValue {
  const ctx = useContext(ScaleContext);
  if (!ctx) throw new Error("useScale must be used within a ScaleProvider");
  return ctx;
}
