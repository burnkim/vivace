/** Shared data model for the entire Vivace menu. One shape powers all 5 layouts. */

export type BadgeKind = "signature" | "best";

export type MenuItem = {
  id: string;
  nameEn: string;
  nameKr: string;
  /** Price string exactly as printed, e.g. "4.0" (= 4,000원). */
  price: string;
  /** Secondary price line, e.g. "take out 3.5". */
  priceNote?: string;
  /** Short one-line tasting/description (tea & beverage). */
  desc?: string;
  badge?: BadgeKind;
};

export type MenuSection = {
  id: string;
  titleEn: string;
  /** Right-aligned subtitle on the header row, e.g. "Espresso Base", "Hot / Ice". */
  titleSub?: string;
  /** Badge shown next to the section title (e.g. Filter Coffee "Best"). */
  badge?: BadgeKind;
  items: MenuItem[];
  /** Footnote under the section, e.g. the decaf / extra-shot note. */
  note?: string;
};

/** Hand-drip / single-origin filter coffee — richer per-bean copy. */
export type BeanItem = {
  id: string;
  nameEn: string;
  /** Processing / grade tag rendered small after the name, e.g. "Washed". */
  grade?: string;
  price: string;
  /** Quoted headline copy, e.g. "입안에 피어나는 맑고 화사한 아카시아꽃". */
  headCopy: string;
  /** Multi-line description. */
  desc: string;
  badge?: BadgeKind;
};

export type HandDripSection = {
  titleEn: string;
  titleSub?: string;
  badge?: BadgeKind;
  beans: BeanItem[];
  /** Roasting-philosophy footer note. */
  footerNote: string;
};

export type BlendBox = {
  id: string;
  label: string; // "[A] Blend"
  desc: string;
};

/* ----------------------------- Layout config ----------------------------- */

/** Vertical distribution of groups inside a column. */
export type VAlign = "start" | "center" | "end" | "between";

/**
 * A placeable unit, addressed by string id:
 *  - "section:<sectionId>"   a standard menu section
 *  - "blend:<blendId>"       a blend description box
 *  - "handdrip"              full hand-drip list (header + beans + footer)
 *  - "handdrip-compact"      condensed hand-drip grid
 *  - "note:espresso"         the decaf / extra-shot note
 */
export type GroupId = string;

export type ColumnDef = { id: string; groups: GroupId[]; align: VAlign };
export type RowDef = { id: string; grow: boolean; columns: ColumnDef[] };
export type PageLayoutDef = { rows: RowDef[] };

/** The three configurable base layouts. A3-L/R reuse A4-L/R. */
export type LayoutKey = "a4all" | "a4l" | "a4r";

export type StyleConfig = {
  /** Google font family used for titles / English names / prices. */
  titleFont: string;
  /** Google font family used for body / Korean / descriptions. */
  bodyFont: string;
  /** Gap between groups within a column (px @ A4 native scale). */
  groupGap: number;
  /** Gap between items within a section (px @ A4 native scale). */
  itemGap: number;
  /** Line-height multiplier for descriptions. */
  lineHeight: number;
  /** Show / hide all blend description boxes. */
  showBlends: boolean;
  /** Page side margin — left/right (px @ A4 native scale). Optional; defaults to token. */
  pagePadX?: number;
  /** Page top/bottom margin (px @ A4 native scale). Optional; defaults to token. */
  pagePadY?: number;
  /** Gap between columns within a row (px @ A4 native scale). Optional; defaults to token. */
  columnGap?: number;
};

/** Editor defaults for the optional spacing fields (match tokens.ts BASE.space). */
export const STYLE_DEFAULTS = { pagePadX: 150, pagePadY: 170, columnGap: 56 } as const;

export type MenuConfig = {
  layouts: Record<LayoutKey, PageLayoutDef>;
  style: StyleConfig;
};

export type MenuData = {
  sections: MenuSection[];
  blends: BlendBox[];
  handdrip: HandDripSection;
  notes: {
    /** Decaf / extra shot note shown in the espresso section. */
    espresso: string;
  };
  config: MenuConfig;
};
