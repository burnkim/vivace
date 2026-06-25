import { useState } from "react";
import { ScaleToFit } from "./ScaleToFit";
import { MenuPage } from "../pages/MenuPage";
import { Button } from "../ui/button";
import { useMenuStore } from "../../state/menu-store";
import { PAGE_ORDER, PAGE_META, type PageId } from "../../data/section-layout";
import { PAGE_PX } from "../../menu/tokens";

/** Live single-page preview with a format selector — used beside the editor. */
export function PagePreview({ initial = "a4l" }: { initial?: PageId }) {
  const { data } = useMenuStore();
  const [page, setPage] = useState<PageId>(initial);
  const px = PAGE_PX[PAGE_META[page].paper];

  return (
    <div className="flex size-full flex-col bg-neutral-200">
      <div className="flex flex-wrap gap-1 border-b bg-white/70 p-2">
        {PAGE_ORDER.map((p) => (
          <Button key={p} size="sm" variant={p === page ? "default" : "ghost"} onClick={() => setPage(p)}>
            {PAGE_META[p].label}
          </Button>
        ))}
      </div>
      <div className="min-h-0 flex-1 p-4">
        <ScaleToFit contentWidth={px.w} contentHeight={px.h} mode="contain" padding={8}>
          <div style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <MenuPage page={page} data={data} />
          </div>
        </ScaleToFit>
      </div>
    </div>
  );
}
