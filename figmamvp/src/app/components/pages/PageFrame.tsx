import type { ReactNode } from "react";
import { ScaleProvider, useScale } from "../../menu/ScaleContext";
import type { PaperSize } from "../../menu/tokens";
import type { StyleConfig } from "../../data/menu-types";

/**
 * A single physical sheet. Renders a fixed-pixel white canvas at the paper's
 * native resolution (so PDF capture is crisp); callers scale it to fit the
 * screen with CSS transforms. Wraps children in the matching ScaleProvider.
 */
export function PageFrame({
  paper,
  style,
  children,
  id,
}: {
  paper: PaperSize;
  style?: StyleConfig;
  children: ReactNode;
  id?: string;
}) {
  return (
    <ScaleProvider paper={paper} style={style}>
      <PageCanvas id={id}>{children}</PageCanvas>
    </ScaleProvider>
  );
}

function PageCanvas({ id, children }: { id?: string; children: ReactNode }) {
  const { pageWidthPx, pageHeightPx, tokens } = useScale();
  return (
    <div
      id={id}
      data-vivace-page
      style={{
        width: pageWidthPx,
        height: pageHeightPx,
        backgroundColor: "white",
        boxSizing: "border-box",
        padding: `${tokens.space.pagePadY}px ${tokens.space.pagePadX}px`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}
