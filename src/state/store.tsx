import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Block, GroupBlock, MenuDocument, Page } from "../core/types";
import { findBlock, findParent, uid, walk } from "../core/doc";
import { makeSeedDocument } from "../core/seed";
import { isRemoteEnabled, loadRemote } from "../lib/sync";

export type SyncStatus = "local" | "loading" | "saving" | "synced" | "error";
export type UiMode = "admin" | "edit";

const LS_KEY = "vivace-studio-doc-v1";
const MODE_KEY = "vivace-ui-mode";

/** Phones default to the simple content editor; wider screens to the full studio.
    The choice is remembered once the user toggles. */
function loadMode(): UiMode {
  try {
    const m = localStorage.getItem(MODE_KEY);
    if (m === "admin" || m === "edit") return m;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.innerWidth < 768) return "edit";
  return "admin";
}

/** One-time upgrade: v2 makes groups inherit gap from tokens (strips baked-in
    group gaps) so the global section/column gap controls take effect. */
function migrateDoc(doc: MenuDocument): MenuDocument {
  const v = doc.schemaVersion ?? 0;
  // v2: groups inherit gap from tokens (strip baked-in group gaps).
  if (v < 2) {
    for (const p of doc.pages) walk(p.root, (b) => { if (b.type === "group" && b.style) delete b.style.gap; });
  }
  // v3: A3 pages mirror their A4 counterpart (shared content, auto-synced).
  if (v < 3) {
    const mirror: Record<string, string> = { a3l: "a4l", a3r: "a4r" };
    for (const p of doc.pages) {
      const src = mirror[p.id];
      if (src && doc.pages.some((x) => x.id === src)) {
        p.mirror = src;
        p.root = { id: `mir-${p.id}`, type: "group", name: "(미러)", children: [] };
      }
    }
  }
  doc.schemaVersion = 3;
  return doc;
}

function loadDoc(): MenuDocument {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return migrateDoc(JSON.parse(raw) as MenuDocument);
  } catch {
    /* ignore */
  }
  return makeSeedDocument();
}

export function saveDoc(doc: MenuDocument) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(doc));
  } catch {
    /* ignore */
  }
}

interface StudioState {
  doc: MenuDocument;
  currentPageId: string;
  selectedId: string | null;
  uiMode: UiMode;

  select: (id: string | null) => void;
  setPage: (id: string) => void;
  setUiMode: (m: UiMode) => void;

  updateDoc: (recipe: (d: MenuDocument) => void) => void;
  updateBlock: (id: string, recipe: (b: Block) => void) => void;
  updatePage: (id: string, recipe: (p: Page) => void) => void;

  addBlock: (parentId: string, block: Block, index?: number) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  /** Move a block under a new parent group at a given index (drag-and-drop). */
  moveBlockTo: (id: string, parentId: string, index: number) => void;
  /** Replace a page's whole content with a deep copy of another page's. The
      target keeps its own paper/scale, so an A4 layout copied to A3 just scales up. */
  copyPageContent: (fromId: string, toId: string) => void;

  resetDoc: () => void;

  syncStatus: SyncStatus;
  setSyncStatus: (s: SyncStatus) => void;
  hydrateRemote: () => Promise<void>;
}

export const useStudio = create<StudioState>()(
  immer((set, get) => ({
    doc: loadDoc(),
    currentPageId: "a4l",
    selectedId: null,
    uiMode: loadMode(),

    select: (id) => set((s) => void (s.selectedId = id)),
    setPage: (id) => set((s) => {
      s.currentPageId = id;
      s.selectedId = null;
    }),
    setUiMode: (m) => {
      try { localStorage.setItem(MODE_KEY, m); } catch { /* ignore */ }
      set((s) => void (s.uiMode = m));
    },

    updateDoc: (recipe) =>
      set((s) => {
        recipe(s.doc);
        s.doc.updatedAt = Date.now();
      }),

    updateBlock: (id, recipe) =>
      set((s) => {
        const b = findBlock(s.doc, id);
        if (b) recipe(b);
        s.doc.updatedAt = Date.now();
      }),

    updatePage: (id, recipe) =>
      set((s) => {
        const p = s.doc.pages.find((x) => x.id === id);
        if (p) recipe(p);
        s.doc.updatedAt = Date.now();
      }),

    addBlock: (parentId, block, index) =>
      set((s) => {
        const parent = findBlock(s.doc, parentId);
        if (parent && parent.type === "group") {
          const g = parent as GroupBlock;
          if (index == null) g.children.push(block);
          else g.children.splice(index, 0, block);
          s.selectedId = block.id;
        }
        s.doc.updatedAt = Date.now();
      }),

    removeBlock: (id) =>
      set((s) => {
        const loc = findParent(s.doc, id);
        if (loc) {
          loc.parent.children.splice(loc.index, 1);
          if (s.selectedId === id) s.selectedId = null;
        }
        s.doc.updatedAt = Date.now();
      }),

    duplicateBlock: (id) =>
      set((s) => {
        const loc = findParent(s.doc, id);
        if (!loc) return;
        const original = loc.parent.children[loc.index];
        const copy = reId(structuredClone(original));
        loc.parent.children.splice(loc.index + 1, 0, copy);
        s.selectedId = copy.id;
        s.doc.updatedAt = Date.now();
      }),

    moveBlock: (id, dir) =>
      set((s) => {
        const loc = findParent(s.doc, id);
        if (!loc) return;
        const j = loc.index + dir;
        if (j < 0 || j >= loc.parent.children.length) return;
        const arr = loc.parent.children;
        [arr[loc.index], arr[j]] = [arr[j], arr[loc.index]];
        s.doc.updatedAt = Date.now();
      }),

    moveBlockTo: (id, parentId, index) =>
      set((s) => {
        if (id === parentId) return;
        const moving = findBlock(s.doc, id);
        const newParent = findBlock(s.doc, parentId);
        if (!moving || !newParent || newParent.type !== "group") return;
        // Reject moving a group into its own subtree (would create a cycle).
        let cycle = false;
        walk(moving, (b) => {
          if (b.id === parentId) cycle = true;
        });
        if (cycle) return;
        const loc = findParent(s.doc, id);
        if (!loc) return;
        const [node] = loc.parent.children.splice(loc.index, 1);
        const arr = (newParent as GroupBlock).children;
        const clamped = Math.max(0, Math.min(index, arr.length));
        arr.splice(clamped, 0, node);
        s.doc.updatedAt = Date.now();
      }),

    copyPageContent: (fromId, toId) => {
      // Clone from the plain current snapshot (get()), NOT from inside the immer
      // producer — structuredClone on a draft Proxy can throw / mis-clone.
      const fromPage = get().doc.pages.find((p) => p.id === fromId);
      if (!fromPage || fromId === toId) return;
      const clone = reId(structuredClone(fromPage.root)) as GroupBlock;
      set((s) => {
        const to = s.doc.pages.find((p) => p.id === toId);
        if (!to) return;
        to.root = clone;
        s.selectedId = null;
        s.doc.updatedAt = Date.now();
      });
    },

    resetDoc: () =>
      set((s) => {
        s.doc = makeSeedDocument();
        s.selectedId = null;
      }),

    syncStatus: isRemoteEnabled() ? "loading" : "local",
    setSyncStatus: (st) => set((s) => void (s.syncStatus = st)),
    hydrateRemote: async () => {
      if (!isRemoteEnabled()) return;
      set((s) => void (s.syncStatus = "loading"));
      try {
        const remoteRaw = await loadRemote();
        const remote = remoteRaw ? migrateDoc(remoteRaw) : null;
        if (remote) {
          set((s) => {
            s.doc = remote;
            s.syncStatus = "synced";
          });
          saveDoc(remote);
        } else {
          // No studio doc in the cloud yet; the first edit will push it.
          set((s) => void (s.syncStatus = "synced"));
        }
      } catch {
        set((s) => void (s.syncStatus = "error"));
      }
    },
  })),
);

/** Re-id a cloned block subtree so ids stay unique. */
function reId(block: Block): Block {
  block.id = uid(block.type.slice(0, 3));
  if (block.type === "group") block.children = block.children.map(reId);
  return block;
}

export function currentPage(s: StudioState): Page {
  return s.doc.pages.find((p) => p.id === s.currentPageId) ?? s.doc.pages[0];
}
