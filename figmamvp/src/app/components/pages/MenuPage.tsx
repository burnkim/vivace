import { PageFrame } from "./PageFrame";
import { LayoutRenderer } from "./LayoutRenderer";
import { PAGE_META, type PageId } from "../../data/section-layout";
import type { MenuData } from "../../data/menu-types";

/**
 * Renders any of the five print formats at its native pixel size, driven by the
 * page's configurable layout. `domId` lets the PDF exporter find the node.
 */
export function MenuPage({ page, data, domId }: { page: PageId; data: MenuData; domId?: string }) {
  const meta = PAGE_META[page];
  const layout = data.config.layouts[meta.layoutKey];
  return (
    <PageFrame paper={meta.paper} style={data.config.style} id={domId}>
      <LayoutRenderer
        layout={layout}
        data={data}
        logo={meta.logo}
        expandHandDrip={meta.expandHandDrip}
      />
    </PageFrame>
  );
}
