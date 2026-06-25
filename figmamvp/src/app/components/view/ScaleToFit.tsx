import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  /** Native (unscaled) content size in px. */
  contentWidth: number;
  contentHeight: number;
  /** "contain" fits the whole page; "width"/"height" fit one axis. */
  mode?: "contain" | "width" | "height";
  padding?: number;
  children: ReactNode;
};

/**
 * Scales a fixed-pixel page down (or up) to fit its container using a CSS
 * transform, preserving aspect ratio. The container reserves the scaled box
 * size so layout stays correct.
 */
export function ScaleToFit({ contentWidth, contentHeight, mode = "contain", padding = 0, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const compute = () => {
      const aw = el.clientWidth - padding * 2;
      const ah = el.clientHeight - padding * 2;
      const sw = aw / contentWidth;
      const sh = ah / contentHeight;
      const s = mode === "width" ? sw : mode === "height" ? sh : Math.min(sw, sh);
      setScale(s > 0 ? s : 1);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contentWidth, contentHeight, mode, padding]);

  return (
    <div ref={ref} className="flex size-full items-center justify-center overflow-hidden">
      <div style={{ width: contentWidth * scale, height: contentHeight * scale, flexShrink: 0 }}>
        <div
          style={{
            width: contentWidth,
            height: contentHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
