import { ScaleToFit } from "./ScaleToFit";
import { MenuPage } from "../pages/MenuPage";
import { PAGE_PX } from "../../menu/tokens";
import { useMenuStore } from "../../state/menu-store";

const GAP = 80; // px between the two A3 sheets, at native scale

/**
 * Full-screen horizontal presentation: A3-L and A3-R side by side, scaled to
 * fill the viewport. This is the "wide" web view of the external-panel menu.
 */
export function WebHorizontal() {
  const { data } = useMenuStore();
  const { w, h } = PAGE_PX.a3;
  return (
    <div className="size-full bg-neutral-200">
      <ScaleToFit contentWidth={w * 2 + GAP} contentHeight={h} mode="contain" padding={24}>
        <div style={{ display: "flex", gap: GAP }}>
          <div style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <MenuPage page="a3l" data={data} />
          </div>
          <div style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <MenuPage page="a3r" data={data} />
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}
