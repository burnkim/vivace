import symbolPaths from "../../../imports/VivaceMenu02A4R/svg-c0mmww8jrk";
import { useScale } from "../../menu/ScaleContext";

type Props = {
  variant?: "full" | "symbol";
  /** Rendered width in px (height derives from the artwork aspect ratio). */
  width: number;
  className?: string;
};

/**
 * The Vivace wordmark / symbol.
 *  - "symbol": the exact vector droplet exported from Figma (R pages).
 *  - "full":   the brand name set as text ("Vivace") in the menu's display
 *              font. (The original Figma art traced as "Viyace"; replaced for
 *              correct spelling + so the wordmark follows the chosen title font.)
 */
export function VivaceLogo({ variant = "full", width, className }: Props) {
  const { fonts } = useScale();

  if (variant === "symbol") {
    const ratio = 256.892 / 191.504;
    return (
      <svg
        className={className}
        width={width}
        height={width * ratio}
        viewBox="0 0 191.504 256.892"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <path d={symbolPaths.p3789b880} fill="black" />
        <path d={symbolPaths.p33f60a00} fill="black" />
        <path d={symbolPaths.p3be15100} fill="black" />
      </svg>
    );
  }

  const ratio = 211.3 / 618.227; // keep the original wordmark's footprint
  return (
    <div
      className={className}
      style={{
        width,
        height: width * ratio,
        display: "flex",
        alignItems: "center",
        fontFamily: fonts.title,
        fontWeight: 600,
        fontSize: width * 0.3,
        lineHeight: 1,
        letterSpacing: width * -0.004,
        color: "black",
        whiteSpace: "nowrap",
      }}
    >
      Vivace
    </div>
  );
}
