import { useScale } from "../../menu/ScaleContext";
import { Badge } from "./Badge";
import type { BeanItem } from "../../data/menu-types";

/**
 * One hand-drip / filter-coffee entry: bean name + grade tag + price, a quoted
 * headline, then a multi-line description. `grow` lets the row stretch on the
 * expanded A3 hand-drip page.
 */
export function BeanRow({ bean, grow = false }: { bean: BeanItem; grow?: boolean }) {
  const { tokens, fonts, lineHeight } = useScale();
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: tokens.space.rowGap,
        flex: grow ? "1 1 0" : undefined,
        justifyContent: grow ? "center" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: tokens.space.headerGap }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: tokens.space.headerGap, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: fonts.title,
              fontSize: tokens.font.beanNameEn,
              fontWeight: 600,
              letterSpacing: tokens.tracking.body,
              color: "black",
            }}
          >
            {bean.nameEn}
          </span>
          {bean.grade && (
            <span
              style={{
                fontFamily: fonts.title,
                fontSize: tokens.font.beanGrade,
                fontWeight: 500,
                color: "black",
              }}
            >
              {bean.grade}
            </span>
          )}
          {bean.badge && <Badge kind={bean.badge} />}
        </div>
        <span
          style={{
            fontFamily: fonts.title,
            fontSize: tokens.font.beanPrice,
            fontWeight: 600,
            color: "black",
            flexShrink: 0,
          }}
        >
          {bean.price}
        </span>
      </div>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: tokens.font.headCopy,
          fontWeight: 500,
          color: "black",
        }}
      >
        {`"${bean.headCopy}"`}
      </span>
      <span
        style={{
          fontFamily: fonts.body,
          fontSize: tokens.font.beanDesc,
          fontWeight: 400,
          color: "#3a3a3a",
          lineHeight,
          whiteSpace: "pre-line",
        }}
      >
        {bean.desc}
      </span>
    </div>
  );
}
