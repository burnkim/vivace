import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { MenuDocument, Page } from "../core/types";
import { mmToPx, pageMm, PAPER_SCALE } from "../core/tokens";
import { beanRosters, pageRoot, sectionRosters } from "../core/doc";

/** Effective content scale — derived from the paper size (proportional) so a
    token change applies everywhere; custom pages keep their stored scale. */
export function pageScale(page: Page): number {
  return page.paper === "custom" ? page.scale : PAPER_SCALE[page.paper] ?? page.scale;
}
import { RenderContext, type RenderCtx } from "./context";
import { BlockView } from "./BlockRenderer";

export function pageSizePx(page: Page) {
  const { w, h } = pageMm(page.paper, page.orientation, { widthMm: page.widthMm, heightMm: page.heightMm });
  return { w: mmToPx(w), h: mmToPx(h) };
}

export function PageSheet({
  doc,
  page,
  interactive = false,
  selectedId = null,
  onSelect = () => {},
  onBackgroundClick,
}: {
  doc: MenuDocument;
  page: Page;
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onBackgroundClick?: () => void;
}) {
  const { w, h } = pageSizePx(page);
  const badges = Object.fromEntries(doc.badges.map((b) => [b.id, b]));
  const s = pageScale(page);
  const ctx: RenderCtx = { tokens: doc.tokens, scale: s, badges, beanRosters: beanRosters(doc), itemRosters: sectionRosters(doc), interactive, selectedId, onSelect };

  return (
    <RenderContext.Provider value={ctx}>
      <div
        data-menu-sheet
        data-page-id={page.id}
        onClick={interactive ? () => onBackgroundClick?.() : undefined}
        style={{
          width: w,
          height: h,
          background: doc.tokens.color.paper,
          color: doc.tokens.color.ink,
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
          flexShrink: 0,
          paddingTop: page.margin.top * s,
          paddingRight: page.margin.right * s,
          paddingBottom: page.margin.bottom * s,
          paddingLeft: page.margin.left * s,
        }}
      >
        <BlockView block={pageRoot(doc, page)} />
      </div>
    </RenderContext.Provider>
  );
}

/** Scales a fixed-pixel child to fit the available box. */
export function ScaleToFit({ width, height, padding = 28, shadow = true, children }: { width: number; height: number; padding?: number; shadow?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const recompute = () => {
      const cw = el.clientWidth - padding * 2;
      const ch = el.clientHeight - padding * 2;
      if (cw <= 0 || ch <= 0) return;
      setScale(Math.max(0.05, Math.min(cw / width, ch / height)));
    };
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    recompute();
    return () => ro.disconnect();
  }, [width, height, padding]);

  return (
    <div ref={ref} className="studio-scroll" style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding }}>
      <div style={{ width: width * scale, height: height * scale, flexShrink: 0 }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: "top left", boxShadow: shadow ? "0 4px 12px rgba(40,30,20,.06), 0 18px 50px rgba(40,30,20,.10)" : "none" }}>{children}</div>
      </div>
    </div>
  );
}
