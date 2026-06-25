import type { CSSProperties } from "react";
import type {
  Bean,
  Block,
  CompactShow,
  GroupBlock,
  HandDripBlock,
  ImageBlock,
  MenuItem,
  SectionBlock,
  TextBlock,
  WordmarkBlock,
} from "../core/types";
import { cssFontStack, resolveLayout, resolveStyle } from "../core/style";
import { resolveBeans, resolveItems } from "../core/doc";
import { badgeStyle } from "./badge";
import { useRender } from "./context";

/**
 * `flow` is the leading margin a parent group injects to space this block from
 * its previous sibling. It is applied as the BASE margin so the block's own
 * margin override REPLACES it (a note/text block can be tightened independent of
 * the column's uniform gap). resolveStyle(block.style) is always spread AFTER
 * flow so an explicit marginTop/marginLeft wins.
 */
type Flow = CSSProperties | undefined;

/** Common selection chrome shared by every block's root element. */
function useChrome(block: Block) {
  const { interactive, selectedId, onSelect } = useRender();
  if (!interactive) return {};
  return {
    "data-block-id": block.id,
    className: `vstudio-blk${selectedId === block.id ? " vstudio-blk-selected" : ""}`,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(block.id);
    },
  };
}

function BadgeView({ id }: { id?: string }) {
  const { badges, scale } = useRender();
  if (!id) return null;
  const b = badges[id];
  if (!b) return null;
  const px = (n: number) => n * scale;
  return <span style={{ ...badgeStyle(b, px), fontSize: px(19) }}>{b.label}</span>;
}

function GroupView({ block, flow }: { block: GroupBlock; flow?: Flow }) {
  const { tokens, scale } = useRender();
  const chrome = useChrome(block);
  const isGrid = (block.style?.columns ?? 0) > 1;
  const dir = block.style?.direction ?? "column";
  // A group with no explicit gap inherits from global tokens: row groups use
  // the column gap, column groups use the section gap.
  const gap = (block.style?.gap ?? (dir === "row" ? tokens.space.columnGap : tokens.space.sectionGap)) * scale;

  const containerStyle: CSSProperties = {
    minWidth: 0,
    ...flow,
    ...resolveStyle(block.style, tokens, scale),
    ...resolveLayout(block.style, scale),
  };
  // Flex groups space children via per-child flow margins (overridable);
  // grids keep their native gap.
  if (!isGrid) containerStyle.gap = 0;

  const kids = block.children.filter((c) => !c.hidden);
  return (
    <div {...chrome} style={containerStyle}>
      {kids.map((c, i) => {
        const childFlow: Flow = !isGrid && i > 0 ? (dir === "row" ? { marginLeft: gap } : { marginTop: gap }) : undefined;
        return <BlockView key={c.id} block={c} flow={childFlow} />;
      })}
    </div>
  );
}

function SectionView({ block, flow }: { block: SectionBlock; flow?: Flow }) {
  const { tokens, scale, itemRosters } = useRender();
  const chrome = useChrome(block);
  const px = (n: number) => n * scale;
  const display = cssFontStack(block.style?.fontFamily, tokens, "display");
  const body = cssFontStack(undefined, tokens, "body");
  const priceFont = cssFontStack(block.priceStyle?.fontFamily ?? tokens.fonts.price, tokens, "display");

  const titleSize = px(block.style?.fontSize ?? tokens.font.sectionTitle);
  const nameEnSize = px(block.itemStyle?.fontSize ?? tokens.font.itemNameEn);
  const krSize = px(tokens.font.itemNameKr);
  const priceSize = px(block.priceStyle?.fontSize ?? tokens.font.itemPrice);
  const descSize = px(block.descStyle?.fontSize ?? tokens.font.itemDesc);
  const itemGap = px(block.style?.gap ?? tokens.space.itemGap);
  const container = resolveStyle(block.style, tokens, scale);

  return (
    <div {...chrome} style={{ width: "100%", ...flow, ...container }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: `${px(tokens.stroke)}px solid ${tokens.color.line}`,
          paddingBottom: px(10),
          marginBottom: px(18),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: px(10), fontFamily: display, fontWeight: 800, fontSize: titleSize, letterSpacing: px(tokens.tracking.title), color: tokens.color.ink }}>
          {block.titleEn}
          <BadgeView id={block.badge} />
        </span>
        {block.titleSub && (
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: px(tokens.font.sectionSub), color: tokens.color.ink }}>{block.titleSub}</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: itemGap }}>
        {resolveItems(block, itemRosters).filter((i) => !i.hidden).map((it) => (
          <ItemRow key={it.id} it={it} sizes={{ nameEnSize, krSize, priceSize, descSize }} display={display} body={body} priceFont={priceFont} />
        ))}
      </div>

      {block.note && (
        <div style={{ marginTop: px(10), textAlign: "right", fontSize: px(tokens.font.note), color: tokens.color.ink, whiteSpace: "pre-line", lineHeight: 1.5, fontFamily: body }}>
          {block.note}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  it,
  sizes,
  display,
  body,
  priceFont,
}: {
  it: MenuItem;
  sizes: { nameEnSize: number; krSize: number; priceSize: number; descSize: number };
  display: string;
  body: string;
  priceFont: string;
}) {
  const { tokens, scale } = useRender();
  const px = (n: number) => n * scale;
  const nameSize = it.style?.fontSize ? px(it.style.fontSize) : sizes.nameEnSize;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "baseline", columnGap: px(10), ...resolveStyle(it.style, tokens, scale) }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: px(10), flexWrap: "wrap" }}>
        <span style={{ fontFamily: display, fontWeight: 700, fontSize: nameSize, color: tokens.color.ink, lineHeight: 1.1 }}>{it.nameEn}</span>
        <span style={{ fontFamily: body, fontWeight: 500, fontSize: sizes.krSize, color: tokens.color.ink }}>{it.nameKr}</span>
        <BadgeView id={it.badge} />
      </div>
      <div style={{ fontFamily: priceFont, fontWeight: 700, fontSize: sizes.priceSize, justifySelf: "end", whiteSpace: "nowrap", textAlign: "right" }}>
        {it.price}
        {it.priceNote && <span style={{ display: "block", fontFamily: body, fontWeight: 500, fontSize: px(tokens.font.itemPriceNote), color: tokens.color.muted, lineHeight: 1.1 }}>{it.priceNote}</span>}
      </div>
      {it.desc && (
        <div style={{ gridColumn: "1 / 2", marginTop: px(3), fontSize: sizes.descSize, color: tokens.color.muted, lineHeight: 1.5, fontFamily: body }}>{it.desc}</div>
      )}
    </div>
  );
}

/** Effective per-element sizes (px @ base) for a hand-drip block's beans —
    each slot overrides the matching global token. */
interface BeanSizes {
  name: number;
  grade: number;
  price: number;
  head: number;
  desc: number;
}

function HandDripView({ block, flow }: { block: HandDripBlock; flow?: Flow }) {
  const { tokens, scale, beanRosters } = useRender();
  const chrome = useChrome(block);
  const px = (n: number) => n * scale;
  const display = cssFontStack(block.style?.fontFamily, tokens, "display");
  const body = cssFontStack(undefined, tokens, "body");
  const priceFont = cssFontStack(block.priceStyle?.fontFamily ?? tokens.fonts.price, tokens, "display");
  const gradeFont = cssFontStack(block.gradeStyle?.fontFamily ?? tokens.fonts.grade, tokens, "display");
  const detailed = block.variant !== "compact";
  const beanGap = px(block.style?.gap ?? (detailed ? 40 : 24));
  const container = resolveStyle(block.style, tokens, scale);

  const sizes: BeanSizes = {
    name: block.nameStyle?.fontSize ?? tokens.font.beanNameEn,
    grade: block.gradeStyle?.fontSize ?? tokens.font.beanGrade,
    price: block.priceStyle?.fontSize ?? tokens.font.beanPrice,
    head: block.headStyle?.fontSize ?? tokens.font.headCopy,
    desc: block.descStyle?.fontSize ?? tokens.font.beanDesc,
  };
  const headWeight = tokens.headCopyWeight ?? 700;
  // Compact field visibility: default = head copy only (historical behaviour).
  const compact = block.compactShow ?? { headCopy: true };
  const beans = resolveBeans(block, beanRosters);

  return (
    <div {...chrome} style={{ width: "100%", ...flow, ...container }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          borderBottom: `${px(tokens.stroke)}px solid ${tokens.color.line}`,
          paddingBottom: px(10),
          marginBottom: px(18),
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: px(10), fontFamily: display, fontWeight: 800, fontSize: px(block.style?.fontSize ?? tokens.font.sectionTitle), letterSpacing: px(tokens.tracking.title) }}>
          {block.titleEn}
          <BadgeView id={block.badge} />
        </span>
        {block.titleSub && <span style={{ fontFamily: display, fontWeight: 700, fontSize: px(tokens.font.sectionSub) }}>{block.titleSub}</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: beanGap }}>
        {beans.filter((b) => !b.hidden).map((b) => (
          <BeanRow key={b.id} b={b} detailed={detailed} compact={compact} sizes={sizes} headWeight={headWeight} display={display} body={body} priceFont={priceFont} gradeFont={gradeFont} />
        ))}
      </div>

      {block.footerNote && (
        <div style={{ marginTop: px(20), fontSize: px(tokens.font.note), color: tokens.color.muted, whiteSpace: "pre-line", lineHeight: 1.5, fontFamily: body }}>{block.footerNote}</div>
      )}
    </div>
  );
}

function BeanRow({ b, detailed, compact, sizes, headWeight, display, body, priceFont, gradeFont }: { b: Bean; detailed: boolean; compact: CompactShow; sizes: BeanSizes; headWeight: number; display: string; body: string; priceFont: string; gradeFont: string }) {
  const { tokens, scale } = useRender();
  const px = (n: number) => n * scale;
  const copyW = `${tokens.beanCopyWidth ?? 66}%`;
  const showGrade = detailed || !!compact.grade; // grade always shows in detailed
  const headEl = b.headCopy && <div style={{ marginTop: px(5), maxWidth: copyW, fontFamily: body, fontWeight: headWeight, fontSize: px(sizes.head), color: tokens.color.ink }}>&ldquo;{b.headCopy}&rdquo;</div>;
  const descEl = b.desc && <div style={{ marginTop: px(3), maxWidth: copyW, fontFamily: body, fontSize: px(sizes.desc), color: tokens.color.muted, lineHeight: 1.55 }}>{b.desc}</div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: px(8) }}>
        <span style={{ flex: 1, fontFamily: display, fontWeight: 700, fontSize: px(sizes.name), lineHeight: 1.1 }}>
          {b.nameEn} {showGrade && b.grade && <span style={{ fontFamily: gradeFont, fontWeight: 400, fontSize: px(sizes.grade) }}>{b.grade}</span>}
        </span>
        <span style={{ fontFamily: priceFont, fontWeight: 700, fontSize: px(sizes.price), whiteSpace: "nowrap" }}>{b.price}</span>
      </div>
      {detailed ? (
        <>
          {headEl}
          {descEl}
        </>
      ) : (
        <>
          {compact.headCopy && headEl}
          {compact.desc && descEl}
        </>
      )}
    </div>
  );
}

function TextView({ block, flow }: { block: TextBlock; flow?: Flow }) {
  const { tokens, scale } = useRender();
  const chrome = useChrome(block);
  const base: CSSProperties = {
    fontFamily: cssFontStack(block.style?.fontFamily, tokens, "body"),
    fontSize: tokens.font.text * scale,
    lineHeight: 1.5,
    color: tokens.color.ink,
    whiteSpace: "pre-line",
  };
  return (
    <div {...chrome} style={{ ...base, ...flow, ...resolveStyle(block.style, tokens, scale) }}>
      {block.text}
    </div>
  );
}

function ImageView({ block, flow }: { block: ImageBlock; flow?: Flow }) {
  const { tokens, scale } = useRender();
  const chrome = useChrome(block);
  const style = resolveStyle(block.style, tokens, scale);
  // A numeric width means "the image is this many px wide" — use content-box so
  // padding doesn't subtract from (and collapse) it. Fill keeps border-box.
  const numericWidth = typeof block.style?.width === "number";
  const boxSizing: CSSProperties["boxSizing"] = numericWidth ? "content-box" : "border-box";
  const align: CSSProperties =
    block.align === "center" ? { marginLeft: "auto", marginRight: "auto" } : block.align === "right" ? { marginLeft: "auto", marginRight: 0 } : block.align === "left" ? { marginLeft: 0, marginRight: "auto" } : {};
  if (!block.src) {
    return (
      <div {...chrome} style={{ width: style.width ?? "100%", height: style.height ?? 200 * scale, display: "flex", alignItems: "center", justifyContent: "center", background: "#f1f1f1", color: "#999", fontSize: 24 * scale, boxSizing, ...flow, ...style, ...align }}>
        이미지 없음
      </div>
    );
  }
  return <img {...chrome} src={block.src} alt={block.alt ?? ""} style={{ display: "block", width: "100%", boxSizing, objectFit: block.fit ?? "contain", ...flow, ...style, ...align }} />;
}

function DividerView({ block, flow }: { block: Block; flow?: Flow }) {
  const { tokens, scale } = useRender();
  const chrome = useChrome(block);
  return <div {...chrome} style={{ borderTop: `${tokens.stroke * scale}px solid ${tokens.color.line}`, ...flow, ...resolveStyle(block.style, tokens, scale) }} />;
}

function SpacerView({ block, flow }: { block: Block; flow?: Flow }) {
  const chrome = useChrome(block);
  const { tokens, scale } = useRender();
  return <div {...chrome} style={{ flexGrow: block.style?.grow ?? 1, ...flow, ...resolveStyle(block.style, tokens, scale) }} />;
}

function WordmarkView({ block, flow }: { block: WordmarkBlock; flow?: Flow }) {
  const { tokens, scale } = useRender();
  const chrome = useChrome(block);
  const size = (block.style?.fontSize ?? tokens.font.wordmark) * scale;
  const box = resolveStyle(block.style, tokens, scale);
  if (block.artVariant === "symbol") {
    const w = size * 0.7;
    return (
      <div {...chrome} style={{ ...flow, ...box }}>
        <svg width={w} height={w * 1.34} viewBox="0 0 120 150" fill="#111" style={{ display: "block", margin: box.textAlign === "left" ? 0 : "0 auto" }}>
          <text x="60" y="92" textAnchor="middle" fontFamily="Playfair Display, serif" fontWeight={800} fontSize={110}>V</text>
          <path d="M60 104 C53 116 47 122 47 130 a13 13 0 0 0 26 0 c0-8-6-14-13-26 Z" />
        </svg>
      </div>
    );
  }
  return (
    <div
      {...chrome}
      style={{
        fontFamily: cssFontStack(block.style?.fontFamily, tokens, "display"),
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: (block.style?.letterSpacing ?? -2) * scale,
        color: tokens.color.ink,
        ...flow,
        ...box,
      }}
    >
      {block.text}
    </div>
  );
}

export function BlockView({ block, flow }: { block: Block; flow?: Flow }) {
  if (block.hidden) return null;
  switch (block.type) {
    case "group":
      return <GroupView block={block} flow={flow} />;
    case "section":
      return <SectionView block={block} flow={flow} />;
    case "handdrip":
      return <HandDripView block={block} flow={flow} />;
    case "text":
      return <TextView block={block} flow={flow} />;
    case "image":
      return <ImageView block={block} flow={flow} />;
    case "divider":
      return <DividerView block={block} flow={flow} />;
    case "spacer":
      return <SpacerView block={block} flow={flow} />;
    case "wordmark":
      return <WordmarkView block={block} flow={flow} />;
    default:
      return null;
  }
}
