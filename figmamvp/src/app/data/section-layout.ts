import type { PaperSize } from "../menu/tokens";
import type { LayoutKey } from "./menu-types";

/** The five print formats. Single source of truth for what each one is. */
export type PageId = "a4all" | "a4l" | "a4r" | "a3l" | "a3r";

export type PageMeta = {
  id: PageId;
  label: string;
  paper: PaperSize;
  /** Which configurable layout drives this page (A3 reuses A4 L/R). */
  layoutKey: LayoutKey;
  /** Logo style at the top of the sheet. */
  logo: "full" | "symbol";
  /** Filename stem used on PDF export. */
  fileStem: string;
  /** Hand-drip page rendered with items stretched to fill the full sheet. */
  expandHandDrip?: boolean;
};

export const PAGE_META: Record<PageId, PageMeta> = {
  a4all: { id: "a4all", label: "A4 전체", paper: "a4", layoutKey: "a4all", logo: "full", fileStem: "Vivace_Menu_A4_All" },
  a4l: { id: "a4l", label: "A4 좌 (메인)", paper: "a4", layoutKey: "a4l", logo: "full", fileStem: "Vivace_Menu_A4_L" },
  a4r: { id: "a4r", label: "A4 우 (핸드드립)", paper: "a4", layoutKey: "a4r", logo: "symbol", fileStem: "Vivace_Menu_A4_R" },
  a3l: { id: "a3l", label: "A3 좌 (메인)", paper: "a3", layoutKey: "a4l", logo: "full", fileStem: "Vivace_Menu_A3_L" },
  a3r: { id: "a3r", label: "A3 우 (핸드드립)", paper: "a3", layoutKey: "a4r", logo: "symbol", fileStem: "Vivace_Menu_A3_R", expandHandDrip: true },
};

export const PAGE_ORDER: PageId[] = ["a4all", "a4l", "a4r", "a3l", "a3r"];

/** The three editable layouts and their labels. */
export const LAYOUT_KEYS: { key: LayoutKey; label: string }[] = [
  { key: "a4all", label: "A4 전체" },
  { key: "a4l", label: "A4 좌 / A3 좌 (메인)" },
  { key: "a4r", label: "A4 우 / A3 우 (핸드드립)" },
];
