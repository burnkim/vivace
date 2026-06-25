import type { MenuDocument } from "../core/types";

/**
 * Local restore-points. The owner hits "백업 저장" to snapshot the whole menu;
 * snapshots are kept in localStorage (device-local, survives reloads and any
 * accidental in-app deletion) newest-first, capped so storage never fills up.
 * Restore/delete are gated to 관리자모드 in the UI.
 */
const KEY = "vivace-backups-v1";
const MAX = 40;

export interface Backup {
  id: string;
  ts: number; // epoch ms — the "date" of the save
  label: string; // optional note
  doc: MenuDocument;
}

export function listBackups(): Backup[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? (raw as Backup[]) : [];
  } catch {
    return [];
  }
}

function write(list: Backup[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch { /* quota — ignore */ }
}

/** Snapshot the document. Returns the new backup (newest-first in the list). */
export function createBackup(doc: MenuDocument, label = ""): Backup {
  const b: Backup = {
    id: `bk-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    ts: Date.now(),
    label,
    doc: structuredClone(doc),
  };
  write([b, ...listBackups()]);
  return b;
}

export function deleteBackup(id: string) {
  write(listBackups().filter((b) => b.id !== id));
}

/** A short content fingerprint shown in the list (how much this snapshot holds). */
export function backupSummary(doc: MenuDocument): string {
  let items = 0, beans = 0;
  for (const p of doc.pages) {
    if (p.mirror) continue;
    const walk = (b: { type: string; items?: unknown[]; beans?: unknown[]; children?: unknown[]; itemsFrom?: string; beansFrom?: string }) => {
      if (b.type === "section" && !b.itemsFrom) items += b.items?.length ?? 0;
      if (b.type === "handdrip" && !b.beansFrom) beans += b.beans?.length ?? 0;
      (b.children as typeof b[] | undefined)?.forEach(walk);
    };
    walk(p.root as never);
  }
  return `메뉴 ${items} · 원두 ${beans}`;
}
