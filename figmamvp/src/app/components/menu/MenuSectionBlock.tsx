import { useScale } from "../../menu/ScaleContext";
import { SectionHeader } from "./SectionHeader";
import { MenuItemRow } from "./MenuItemRow";
import { NoteBlock } from "./NoteBlock";
import type { MenuSection } from "../../data/menu-types";

/** Header + item rows + optional footnote for one standard section. */
export function MenuSectionBlock({ section }: { section: MenuSection }) {
  const { tokens } = useScale();
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: tokens.space.itemGap }}>
      <SectionHeader titleEn={section.titleEn} titleSub={section.titleSub} badge={section.badge} />
      {section.items.map((item) => (
        <MenuItemRow key={item.id} item={item} />
      ))}
      {section.note && <NoteBlock text={section.note} align="right" />}
    </div>
  );
}
