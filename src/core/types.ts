/**
 * Vivace Menu Studio — composable document model.
 *
 * A menu is a DOCUMENT. A document has PAGES. A page is a tree of BLOCKS.
 * Every block can carry a partial STYLE override that layers on top of the
 * document's global tokens. This is what makes the system open-ended: new
 * content (text, images, sections, badges, layouts) is just another block,
 * and any property (font, size, margin, align, ...) is editable per block.
 *
 * Designed to be multi-tenant ready: a MenuDocument is the sellable unit —
 * later scoped to an org/user, versioned, and synced.
 */

export type ID = string;

/* ----------------------------------------------------------------- Style -- */

export type TextAlign = "left" | "center" | "right" | "justify";
export type FlexDir = "row" | "column";
export type Align = "start" | "center" | "end" | "stretch";
export type Justify = "start" | "center" | "end" | "between" | "around";
export type SizeMode = number | "auto" | "fill";

/** Every field optional — a block only overrides what it changes. */
export type Style = Partial<{
  // Typography
  fontFamily: string; // references FontDef.family
  fontSize: number; // px @ base (A4) scale
  fontWeight: number;
  italic: boolean;
  letterSpacing: number; // px @ base scale
  lineHeight: number; // unitless multiplier
  textAlign: TextAlign;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
  color: string;

  // Box model (px @ base scale)
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // Layout (group blocks)
  direction: FlexDir;
  gap: number;
  align: Align; // cross axis
  justify: Justify; // main axis
  wrap: boolean;
  columns: number; // when set (>1) -> CSS grid with N columns
  grow: number; // flex-grow within parent
  width: SizeMode;
  height: SizeMode;

  // Decoration
  background: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  borderSides: ("top" | "right" | "bottom" | "left")[];
  opacity: number;
}>;

/* ----------------------------------------------------------------- Blocks - */

export type BlockType =
  | "group"
  | "section"
  | "handdrip"
  | "text"
  | "image"
  | "divider"
  | "spacer"
  | "wordmark";

export interface BaseBlock {
  id: ID;
  type: BlockType;
  name?: string; // editor label
  style?: Style;
  hidden?: boolean;
  locked?: boolean;
}

/** Container. Children flow per its layout style (row/column/grid). */
export interface GroupBlock extends BaseBlock {
  type: "group";
  children: Block[];
}

export interface MenuItem {
  id: ID;
  nameEn: string;
  nameKr: string;
  price: string;
  priceNote?: string; // e.g. "take out 3.5"
  desc?: string;
  badge?: ID; // -> BadgeDef.id
  style?: Style; // per-item override (power users)
  hidden?: boolean;
}

/** A titled list of menu items (Coffee, Tea, ...). */
export interface SectionBlock extends BaseBlock {
  type: "section";
  titleEn: string;
  titleSub?: string;
  badge?: ID;
  note?: string;
  items: MenuItem[];
  /** Per-element style slots so title / item-name / price / desc size & font
      can be set independently for this section (each item can still override). */
  itemStyle?: Style; // item English name
  priceStyle?: Style; // price
  descStyle?: Style; // description line
  /** When set, the ITEMS are shared (auto-synced, read-only here) from another
      section — e.g. the "A4 전체" overview pulls the A4 좌 menu so editing the
      menu once updates both layouts. `items` is ignored while this is set. */
  itemsFrom?: ID;
}

export interface Bean {
  id: ID;
  nameEn: string;
  grade?: string;
  price: string;
  headCopy?: string;
  desc?: string;
  badge?: ID;
  hidden?: boolean;
}

/** Which bean fields show in compact ("간단") display. Unset ⇒ headCopy only
    (the historical default). Lets the owner keep just the grade, or just the
    description, etc. — toggled independently. */
export interface CompactShow {
  grade?: boolean;
  headCopy?: boolean;
  desc?: boolean;
}

/** Hand-drip / single-origin list with richer per-bean copy. */
export interface HandDripBlock extends BaseBlock {
  type: "handdrip";
  titleEn: string;
  titleSub?: string;
  badge?: ID;
  footerNote?: string;
  beans: Bean[];
  variant?: "detailed" | "compact"; // long poetic vs short
  /** Per-element style slots so name / grade / price / headcopy / desc size &
      font can be set for THIS block independently (like SectionBlock). Each
      falls back to the matching global token when unset. */
  nameStyle?: Style; // bean English name
  gradeStyle?: Style; // grade/process tag
  priceStyle?: Style; // price
  headStyle?: Style; // head copy
  descStyle?: Style; // description
  /** In compact display, which fields to render (see CompactShow). */
  compactShow?: CompactShow;
  /** When set, beans are SHARED (auto-synced, read-only here) from another
      hand-drip block — e.g. the "A4 전체" overview pulls the A4 우 roster so
      editing the beans once updates both. `beans` is ignored while this is set. */
  beansFrom?: ID;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  text: string; // newlines preserved
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string; // url or data uri
  alt?: string;
  fit?: "contain" | "cover";
  /** Horizontal placement when the image is narrower than its container. */
  align?: "left" | "center" | "right";
}

export interface DividerBlock extends BaseBlock {
  type: "divider";
}

export interface SpacerBlock extends BaseBlock {
  type: "spacer"; // flexible space (grow by default)
}

export interface WordmarkBlock extends BaseBlock {
  type: "wordmark";
  text: string;
  artVariant?: "text" | "symbol"; // text wordmark vs droplet symbol
}

export type Block =
  | GroupBlock
  | SectionBlock
  | HandDripBlock
  | TextBlock
  | ImageBlock
  | DividerBlock
  | SpacerBlock
  | WordmarkBlock;

/* ---------------------------------------------------- Registries / Pages -- */

export type BadgeShape = "pill" | "tag" | "outline" | "ellipse" | "sawtooth";
export interface BadgeDef {
  id: ID;
  label: string;
  bg: string;
  fg: string;
  shape: BadgeShape;
}

export type FontSource = "system" | "google" | "adobe" | "custom";
export interface FontDef {
  id: ID;
  family: string; // CSS font-family name
  role: "display" | "body";
  source: FontSource;
  /** For adobe: the Typekit kit id; for custom: the uploaded file URL. */
  href?: string;
}

export type PaperSize = "a4" | "a3" | "a5" | "custom";
export type Orientation = "portrait" | "landscape";

export interface Page {
  id: ID;
  name: string;
  paper: PaperSize;
  /** mm, required when paper === "custom". */
  widthMm?: number;
  heightMm?: number;
  orientation: Orientation;
  /** Content scale relative to A4 base tokens (A3 ≈ 1.36). */
  scale: number;
  /** Page margins, px @ base scale. */
  margin: { top: number; right: number; bottom: number; left: number };
  root: GroupBlock;
  /** If set, this page renders ANOTHER page's content (shared, auto-synced) at
      its own paper/scale. Used so A3 mirrors A4 — edit A4, A3 updates live. */
  mirror?: ID;
}

export interface Tokens {
  /** display = titles/EN names; body = KR/descriptions; price = optional
      separate face for prices; grade = optional face for bean grade/process tag;
      kr = optional override for all Korean glyphs. */
  fonts: { display: string; body: string; price?: string; grade?: string; kr?: string };
  color: { ink: string; muted: string; line: string; paper: string };
  font: Record<
    | "wordmark"
    | "sectionTitle"
    | "sectionSub"
    | "itemNameEn"
    | "itemNameKr"
    | "itemPrice"
    | "itemPriceNote"
    | "itemDesc"
    | "note"
    | "beanNameEn"
    | "beanGrade"
    | "beanPrice"
    | "headCopy"
    | "beanDesc"
    | "text",
    number
  >;
  tracking: { title: number; body: number };
  space: { sectionGap: number; itemGap: number; columnGap: number; headerGap: number };
  stroke: number;
  /** Max width (%) of hand-drip headcopy/description text, so it wraps before
      the price column. Adjustable; defaults to 66. */
  beanCopyWidth?: number;
  /** Global font-weight for hand-drip head copy. Defaults to 700. */
  headCopyWeight?: number;
}

export interface MenuDocument {
  id: ID;
  name: string;
  updatedAt?: number;
  /** Bumped by migrations (e.g. v2 = groups inherit gap from tokens). */
  schemaVersion?: number;
  tokens: Tokens;
  fonts: FontDef[];
  badges: BadgeDef[];
  pages: Page[];
  /** Access gate. `pinHash` = SHA-256 of `vivace:<6-digit pin>`. Unset ⇒ the
      default PIN (000000). Synced via the cloud so the gate is the same on every
      device; a soft deterrent (client-side, data is anon-readable), not strong
      security. */
  security?: { pinHash?: string };
}
