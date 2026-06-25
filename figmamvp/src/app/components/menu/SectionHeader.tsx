import { useScale } from "../../menu/ScaleContext";
import { Badge } from "./Badge";
import type { BadgeKind } from "../../data/menu-types";

type Props = {
  titleEn: string;
  titleSub?: string;
  badge?: BadgeKind;
};

/** Section title row + right-aligned subtitle + full-width divider line below. */
export function SectionHeader({ titleEn, titleSub, badge }: Props) {
  const { tokens, fonts } = useScale();
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: tokens.space.headerGap,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space.headerGap }}>
          <span
            style={{
              fontFamily: fonts.title,
              fontSize: tokens.font.sectionTitle,
              fontWeight: 600,
              letterSpacing: tokens.tracking.title,
              lineHeight: 1,
              color: "black",
            }}
          >
            {titleEn}
          </span>
          {badge && <Badge kind={badge} />}
        </div>
        {titleSub && (
          <span
            style={{
              fontFamily: fonts.title,
              fontSize: tokens.font.sectionSub,
              fontWeight: 500,
              letterSpacing: tokens.tracking.body,
              lineHeight: 1,
              color: "black",
            }}
          >
            {titleSub}
          </span>
        )}
      </div>
      <div
        style={{
          height: tokens.stroke,
          backgroundColor: "black",
          width: "100%",
          marginTop: tokens.space.headerGap,
        }}
      />
    </div>
  );
}
