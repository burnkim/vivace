import type { Bean, Block, GroupBlock, HandDripBlock, MenuDocument, MenuItem, Page, SectionBlock } from "./types";

export function walk(block: Block, fn: (b: Block, parent: GroupBlock | null) => void, parent: GroupBlock | null = null) {
  fn(block, parent);
  if (block.type === "group") for (const c of block.children) walk(c, fn, block);
}

export function findBlock(doc: MenuDocument, id: string): Block | null {
  for (const p of doc.pages) {
    let found: Block | null = null;
    walk(p.root, (b) => {
      if (b.id === id) found = b;
    });
    if (found) return found;
  }
  return null;
}

export function findParent(doc: MenuDocument, id: string): { parent: GroupBlock; index: number } | null {
  for (const p of doc.pages) {
    let res: { parent: GroupBlock; index: number } | null = null;
    walk(p.root, (b, parent) => {
      if (b.id === id && parent) res = { parent, index: parent.children.indexOf(b) };
    });
    if (res) return res;
  }
  return null;
}

export function pageOfBlock(doc: MenuDocument, id: string): Page | null {
  for (const p of doc.pages) {
    let hit = false;
    walk(p.root, (b) => {
      if (b.id === id) hit = true;
    });
    if (hit) return p;
  }
  return null;
}

/** Maps every hand-drip block id → its OWN beans. Blocks that source their beans
    elsewhere (`beansFrom`) are excluded, so a shared roster never chains. */
export function beanRosters(doc: MenuDocument): Record<string, Bean[]> {
  const map: Record<string, Bean[]> = {};
  for (const p of doc.pages) {
    if (p.mirror) continue; // mirrored pages reuse the source page's blocks
    walk(p.root, (b) => {
      if (b.type === "handdrip" && !b.beansFrom) map[b.id] = b.beans;
    });
  }
  return map;
}

/** The beans a hand-drip block actually renders — its own, or a shared roster. */
export function resolveBeans(block: HandDripBlock, rosters: Record<string, Bean[]>): Bean[] {
  return (block.beansFrom && rosters[block.beansFrom]) || block.beans;
}

/** Maps every section id → its OWN items (sections that source their items
    elsewhere via `itemsFrom` are excluded, so a shared menu never chains). */
export function sectionRosters(doc: MenuDocument): Record<string, MenuItem[]> {
  const map: Record<string, MenuItem[]> = {};
  for (const p of doc.pages) {
    if (p.mirror) continue;
    walk(p.root, (b) => {
      if (b.type === "section" && !b.itemsFrom) map[b.id] = b.items;
    });
  }
  return map;
}

/** The items a section actually renders — its own, or a shared menu. */
export function resolveItems(block: SectionBlock, rosters: Record<string, MenuItem[]>): MenuItem[] {
  return (block.itemsFrom && rosters[block.itemsFrom]) || block.items;
}

/** Brand images taken from the menu itself: A4 좌's top wordmark + A4 우's mark.
    Used so the app chrome (header, lock screen) matches the printed logo. */
export function brandLogos(doc: MenuDocument): { wordmark?: string; symbol?: string } {
  const firstImage = (pageId: string): string | undefined => {
    const p = doc.pages.find((x) => x.id === pageId);
    if (!p) return undefined;
    let src: string | undefined;
    walk(p.root, (b) => { if (!src && b.type === "image" && b.src) src = b.src; });
    return src;
  };
  return { wordmark: firstImage("a4l"), symbol: firstImage("a4r") };
}

/** The effective content root for a page — follows `mirror` so A3 shows A4's tree. */
export function pageRoot(doc: MenuDocument, page: Page): GroupBlock {
  if (page.mirror) {
    const src = doc.pages.find((p) => p.id === page.mirror);
    if (src) return src.root;
  }
  return page.root;
}

let _uid = Math.floor(Math.random() * 1e6);
export const uid = (p = "b") => `${p}-${(_uid++).toString(36)}`;
