import { useScale } from "../../menu/ScaleContext";
import { SectionHeader } from "./SectionHeader";
import { BeanRow } from "./BeanRow";
import { NoteBlock } from "./NoteBlock";
import type { MenuData } from "../../data/menu-types";

/**
 * Full hand-drip list (header + beans + footer note), no logo. `expand`
 * stretches bean rows to fill the available height (used on A3-R).
 */
export function HandDripGroup({ data, expand = false }: { data: MenuData; expand?: boolean }) {
  const { tokens } = useScale();
  const hd = data.handdrip;
  return (
    <div style={{ width: "100%", flex: expand ? 1 : undefined, display: "flex", flexDirection: "column", gap: tokens.space.sectionGap, minHeight: 0 }}>
      <SectionHeader titleEn={hd.titleEn} titleSub={hd.titleSub} badge={hd.badge} />
      <div
        style={{
          flex: expand ? 1 : undefined,
          display: "flex",
          flexDirection: "column",
          gap: tokens.space.beanGap,
          justifyContent: expand ? "space-between" : "flex-start",
          minHeight: 0,
        }}
      >
        {hd.beans.map((bean) => (
          <BeanRow key={bean.id} bean={bean} grow={expand} />
        ))}
      </div>
      <NoteBlock text={hd.footerNote} align="center" />
    </div>
  );
}
