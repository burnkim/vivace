import { arrayMove } from "@dnd-kit/sortable";
import type { Block, GroupBlock } from "../core/types";

export interface FlatItem {
  id: string;
  depth: number;
  parentId: string;
  block: Block;
}

/** Flatten a page root's children into a depth-tagged list (root excluded). */
export function flattenTree(root: GroupBlock): FlatItem[] {
  const out: FlatItem[] = [];
  const visit = (b: Block, depth: number, parentId: string) => {
    out.push({ id: b.id, depth, parentId, block: b });
    if (b.type === "group") b.children.forEach((c) => visit(c, depth + 1, b.id));
  };
  root.children.forEach((c) => visit(c, 0, root.id));
  return out;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Where would the dragged item land (new parent + index + depth)? */
export function getProjection(
  items: FlatItem[],
  rootId: string,
  activeId: string,
  overId: string,
  dragOffsetX: number,
  indentWidth: number,
): { parentId: string; index: number; depth: number } | null {
  const overIndex = items.findIndex((i) => i.id === overId);
  const activeIndex = items.findIndex((i) => i.id === activeId);
  if (overIndex === -1 || activeIndex === -1) return null;

  const activeItem = items[activeIndex];
  const newItems = arrayMove(items, activeIndex, overIndex);
  const prev = newItems[overIndex - 1];
  const next = newItems[overIndex + 1];

  const dragDepth = Math.round(dragOffsetX / indentWidth);
  const projected = activeItem.depth + dragDepth;
  const maxDepth = prev ? (prev.block.type === "group" ? prev.depth + 1 : prev.depth) : 0;
  const minDepth = next ? next.depth : 0;
  const depth = clamp(projected, minDepth, maxDepth);

  let parentId = rootId;
  if (depth > 0 && prev) {
    if (depth === prev.depth) parentId = prev.parentId;
    else if (depth > prev.depth && prev.block.type === "group") parentId = prev.id;
    else {
      const ancestor = newItems.slice(0, overIndex).reverse().find((i) => i.depth === depth);
      parentId = ancestor?.parentId ?? rootId;
    }
  }

  const siblings = newItems.filter((i) => (i.id === activeId ? parentId : i.parentId) === parentId);
  const index = siblings.findIndex((i) => i.id === activeId);
  return { parentId, index: index < 0 ? siblings.length : index, depth };
}
