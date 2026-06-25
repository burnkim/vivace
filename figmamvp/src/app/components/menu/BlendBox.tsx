import { useScale } from "../../menu/ScaleContext";
import type { BlendBox as BlendBoxData } from "../../data/menu-types";

/** Bordered "[A]/[B] Blend" description box. */
export function BlendBox({ blend }: { blend: BlendBoxData }) {
  const { tokens, fonts } = useScale();
  return (
    <div
      style={{
        width: "100%",
        border: `${tokens.stroke}px solid black`,
        padding: `${tokens.space.itemGap}px ${tokens.space.sectionGap}px`,
        display: "flex",
        flexDirection: "column",
        gap: tokens.space.blendGap,
      }}
    >
      <span
        style={{
          fontFamily: fonts.title,
          fontSize: tokens.font.blendTitle,
          fontWeight: 600,
          letterSpacing: tokens.tracking.body,
          color: "black",
        }}
      >
        {blend.label}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: tokens.font.blendBody,
          fontWeight: 400,
          color: "black",
          lineHeight: 1.5,
        }}
      >
        {blend.desc}
      </span>
    </div>
  );
}
