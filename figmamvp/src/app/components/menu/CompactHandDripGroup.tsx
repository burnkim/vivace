import { useScale } from "../../menu/ScaleContext";
import { SectionHeader } from "./SectionHeader";
import { NoteBlock } from "./NoteBlock";
import { Badge } from "./Badge";
import type { MenuData } from "../../data/menu-types";

/** Condensed hand-drip grid (name · grade · price + headline only). */
export function CompactHandDripGroup({ data }: { data: MenuData }) {
  const { tokens, fonts } = useScale();
  const hd = data.handdrip;
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: tokens.space.itemGap }}>
      <SectionHeader titleEn={hd.titleEn} titleSub={hd.titleSub} badge={hd.badge} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: tokens.space.columnGap, rowGap: tokens.space.itemGap }}>
        {hd.beans.map((bean) => (
          <div key={bean.id} style={{ display: "flex", flexDirection: "column", gap: tokens.space.rowGap }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: tokens.space.headerGap }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: tokens.space.rowGap * 2, flexWrap: "wrap" }}>
                <span style={{ fontFamily: fonts.title, fontSize: tokens.font.itemNameEn, fontWeight: 600, color: "black" }}>{bean.nameEn}</span>
                {bean.grade && (
                  <span style={{ fontFamily: fonts.title, fontSize: tokens.font.itemPriceNote, fontWeight: 500, color: "black" }}>{bean.grade}</span>
                )}
                {bean.badge && <Badge kind={bean.badge} />}
              </span>
              <span style={{ fontFamily: fonts.title, fontSize: tokens.font.itemPrice, fontWeight: 600, color: "black", flexShrink: 0 }}>{bean.price}</span>
            </div>
            <span style={{ fontFamily: fonts.body, fontSize: tokens.font.itemDesc, fontWeight: 400, color: "#3a3a3a", lineHeight: 1.3 }}>
              {`"${bean.headCopy}"`}
            </span>
          </div>
        ))}
      </div>
      <NoteBlock text={hd.footerNote} align="center" size="small" />
    </div>
  );
}
