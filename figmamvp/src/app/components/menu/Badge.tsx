import { useScale } from "../../menu/ScaleContext";
import { FONT_SANS } from "../../menu/tokens";
import type { BadgeKind } from "../../data/menu-types";

const LABEL: Record<BadgeKind, string> = {
  signature: "signature",
  best: "Best",
};

/** Small grey pill badge ("signature" / "Best"). Sizes from scale tokens. */
export function Badge({ kind }: { kind: BadgeKind }) {
  const { tokens } = useScale();
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#5B5B5B",
        color: "white",
        borderRadius: tokens.badge.radius,
        padding: `${tokens.badge.padY}px ${tokens.badge.padX}px`,
        fontFamily: FONT_SANS,
        fontSize: tokens.font.badge,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {LABEL[kind]}
    </span>
  );
}
