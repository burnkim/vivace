import { useStudio } from "./state/store";
import { brandLogos } from "./core/doc";

/**
 * Brand chrome sourced from the menu's own logos — the V mark (from A4 우) and
 * the Vivace wordmark (from A4 좌), scaled down. Falls back to a terracotta tile
 * / Playfair text if the menu has no logo images.
 */
export function BrandMark({ size = 28 }: { size?: number }) {
  const symbol = useStudio((s) => brandLogos(s.doc).symbol);
  if (symbol) return <img src={symbol} alt="Vivace" style={{ height: size, width: "auto", objectFit: "contain", display: "block" }} />;
  return (
    <div className="flex items-center justify-center rounded-lg bg-[#c2603f] text-white shadow-sm" style={{ width: size, height: size, fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: size * 0.6, lineHeight: 1 }}>V</div>
  );
}

export function BrandWordmark({ height = 20 }: { height?: number }) {
  const wordmark = useStudio((s) => brandLogos(s.doc).wordmark);
  if (wordmark) return <img src={wordmark} alt="Vivace" style={{ height, width: "auto", objectFit: "contain", display: "block" }} />;
  return <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, letterSpacing: "-0.02em", fontSize: height }} className="text-[#2a2723]">Vivace</span>;
}
