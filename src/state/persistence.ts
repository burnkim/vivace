import { useEffect, useRef } from "react";
import { useStudio, saveDoc } from "./store";
import { ensureFonts } from "../lib/fonts";
import { isRemoteEnabled, saveRemote } from "../lib/sync";
import { projectToTables } from "../lib/tables";
import { walk } from "../core/doc";
import type { MenuDocument } from "../core/types";

/** Count of editable content (items + beans) — a corruption tripwire. Shared
    (mirrored) sections/beans are counted only at their source. */
export function contentCount(doc: MenuDocument): number {
  let n = 0;
  for (const p of doc.pages) {
    if (p.mirror) continue;
    walk(p.root, (b) => {
      if (b.type === "section" && !b.itemsFrom) n += b.items.length;
      if (b.type === "handdrip" && !b.beansFrom) n += b.beans.length;
    });
  }
  return n;
}

/**
 * Document persistence — runs ONCE at the app root so it works in BOTH the full
 * studio (관리자) and the mobile content editor (수정). Loads fonts, hydrates
 * from the cloud, and debounce-saves every change to localStorage + Supabase,
 * with a tripwire that refuses to push a document that suddenly lost most of
 * its content (the bug that kept emptying the bean roster).
 */
export function useStudioPersistence() {
  const fonts = useStudio((s) => s.doc.fonts);
  // Expose the store for debugging / headless verification.
  if (typeof window !== "undefined") (window as unknown as { __studio: typeof useStudio }).__studio = useStudio;

  useEffect(() => {
    ensureFonts(fonts);
  }, [fonts]);

  useEffect(() => {
    void useStudio.getState().hydrateRemote();
  }, []);

  const lastGoodCount = useRef(contentCount(useStudio.getState().doc));
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const unsub = useStudio.subscribe((state, prev) => {
      if (state.doc === prev.doc) return; // ignore non-document changes (selection, mode, status)
      clearTimeout(t);
      t = setTimeout(() => {
        saveDoc(state.doc); // localStorage always (so the user never loses local edits)
        if (!isRemoteEnabled()) return;
        const count = contentCount(state.doc);
        if (lastGoodCount.current >= 12 && count < lastGoodCount.current * 0.4) {
          useStudio.getState().setSyncStatus("error");
          console.warn(`[sync] BLOCKED cloud save: content dropped ${lastGoodCount.current} → ${count}. Saved locally only; reload to restore from cloud.`);
          return;
        }
        lastGoodCount.current = count;
        const { setSyncStatus } = useStudio.getState();
        setSyncStatus("saving");
        saveRemote(state.doc)
          .then(() => { setSyncStatus("synced"); void projectToTables(state.doc); })
          .catch(() => setSyncStatus("error"));
      }, 500);
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, []);
}
