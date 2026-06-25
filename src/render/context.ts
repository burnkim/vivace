import { createContext, useContext } from "react";
import type { BadgeDef, Bean, MenuItem, Tokens } from "../core/types";

export interface RenderCtx {
  tokens: Tokens;
  scale: number;
  badges: Record<string, BadgeDef>;
  /** Shared bean rosters by source block id (for hand-drip `beansFrom`). */
  beanRosters: Record<string, Bean[]>;
  /** Shared item rosters by source section id (for section `itemsFrom`). */
  itemRosters: Record<string, MenuItem[]>;
  /** When true the menu is editable: blocks are clickable / show selection. */
  interactive: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const RenderContext = createContext<RenderCtx | null>(null);

export function useRender(): RenderCtx {
  const ctx = useContext(RenderContext);
  if (!ctx) throw new Error("useRender must be used within a RenderContext");
  return ctx;
}
