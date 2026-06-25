import { useScale } from "../../menu/ScaleContext";
import { Badge } from "./Badge";
import type { MenuItem } from "../../data/menu-types";

/**
 * One espresso/tea/beverage line: English name + Korean name (+ badge) on the
 * left, price on the right, optional one-line description beneath.
 */
export function MenuItemRow({ item }: { item: MenuItem }) {
  const { tokens, fonts, lineHeight } = useScale();
  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: tokens.space.rowGap }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: tokens.space.headerGap }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.space.headerGap, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: fonts.title,
              fontSize: tokens.font.itemNameEn,
              fontWeight: 500,
              letterSpacing: tokens.tracking.body,
              color: "black",
            }}
          >
            {item.nameEn}
          </span>
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: tokens.font.itemNameKr,
              fontWeight: 400,
              color: "black",
            }}
          >
            {item.nameKr}
          </span>
          {item.badge && <Badge kind={item.badge} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: fonts.title,
              fontSize: tokens.font.itemPrice,
              fontWeight: 600,
              color: "black",
            }}
          >
            {item.price}
          </span>
          {item.priceNote && (
            <span
              style={{
                fontFamily: fonts.title,
                fontSize: tokens.font.itemPriceNote,
                fontWeight: 400,
                color: "black",
              }}
            >
              {item.priceNote}
            </span>
          )}
        </div>
      </div>
      {item.desc && (
        <span
          style={{
            fontFamily: fonts.body,
            fontSize: tokens.font.itemDesc,
            fontWeight: 400,
            color: "#3a3a3a",
            lineHeight,
          }}
        >
          {item.desc}
        </span>
      )}
    </div>
  );
}
