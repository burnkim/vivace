import { useScale } from "../../menu/ScaleContext";
import { VivaceLogo } from "../menu/VivaceLogo";
import { GroupRenderer } from "./GroupRenderer";
import type { MenuData, PageLayoutDef, VAlign } from "../../data/menu-types";

const JUSTIFY: Record<VAlign, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
};

/**
 * Renders a page from its config-driven layout: a stack of rows, each holding
 * columns, each holding ordered groups. Logo sits at the top. This is the one
 * renderer behind all five formats — A3 reuses the A4 L/R layouts at scale.
 */
export function LayoutRenderer({
  layout,
  data,
  logo,
  expandHandDrip = false,
}: {
  layout: PageLayoutDef;
  data: MenuData;
  logo: "full" | "symbol";
  expandHandDrip?: boolean;
}) {
  const { tokens, pageWidthPx } = useScale();

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", gap: tokens.space.sectionGap }}>
      {logo === "symbol" ? (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <VivaceLogo variant="symbol" width={pageWidthPx * 0.08} />
        </div>
      ) : (
        <VivaceLogo variant="full" width={pageWidthPx * 0.3} />
      )}

      {layout.rows.map((row) => (
        <div
          key={row.id}
          style={{
            display: "flex",
            gap: tokens.space.columnGap,
            flex: row.grow ? "1 1 0" : "0 0 auto",
            minHeight: 0,
          }}
        >
          {row.columns.map((col) => (
            <div
              key={col.id}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: tokens.space.sectionGap,
                justifyContent: JUSTIFY[col.align],
              }}
            >
              {col.groups.map((g) => (
                <GroupRenderer key={g} groupId={g} data={data} expandHandDrip={expandHandDrip} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
