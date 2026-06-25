import { MenuSectionBlock } from "../menu/MenuSectionBlock";
import { BlendBox } from "../menu/BlendBox";
import { NoteBlock } from "../menu/NoteBlock";
import { HandDripGroup } from "../menu/HandDripGroup";
import { CompactHandDripGroup } from "../menu/CompactHandDripGroup";
import { parseGroup } from "../../data/groups";
import type { MenuData } from "../../data/menu-types";

/** Renders one placeable group by its id. Returns null for hidden/unknown groups. */
export function GroupRenderer({
  groupId,
  data,
  expandHandDrip = false,
}: {
  groupId: string;
  data: MenuData;
  expandHandDrip?: boolean;
}) {
  const p = parseGroup(groupId);
  if (!p) return null;

  switch (p.kind) {
    case "section": {
      const section = data.sections.find((s) => s.id === p.id);
      return section ? <MenuSectionBlock section={section} /> : null;
    }
    case "blend": {
      if (!data.config.style.showBlends) return null;
      const blend = data.blends.find((b) => b.id === p.id);
      return blend ? <BlendBox blend={blend} /> : null;
    }
    case "handdrip":
      return <HandDripGroup data={data} expand={expandHandDrip} />;
    case "handdrip-compact":
      return <CompactHandDripGroup data={data} />;
    case "note":
      return <NoteBlock text={data.notes.espresso} align="right" />;
  }
}
