import type { MenuDocument } from "../core/types";
import { walk } from "../core/doc";

/**
 * Projects the menu document into proper Supabase tables (via PostgREST) so the
 * data lives as organized, queryable rows — not only a single JSON blob. This is
 * ADDITIVE: it runs after the normal save and swallows errors (the tables may
 * not exist yet). Run `supabase-tables.sql` once to create them.
 *
 *   menu_documents  — the full document (jsonb), a robust recoverable copy
 *   menu_items      — every menu item as a row (section, names, price, badge)
 *   beans           — the hand-drip bean roster as rows (order, hidden, copy)
 */
const URL_ENV = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ENV = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const REST = URL_ENV ? `${URL_ENV.replace(/\/$/, "")}/rest/v1` : "";
const headers: Record<string, string> = {
  apikey: KEY_ENV ?? "",
  Authorization: `Bearer ${KEY_ENV ?? ""}`,
  "Content-Type": "application/json",
};

export const tablesEnabled = () => Boolean(URL_ENV && KEY_ENV);

// Goes true after a 404 (tables not created yet) so we stop retrying / log spam.
let missing = false;

type ItemRow = { id: string; page: string; section: string; name_en: string; name_kr: string; price: string; badge: string | null; descr: string | null; sort: number };
type BeanRow = { id: string; name_en: string; grade: string | null; price: string; head_copy: string | null; descr: string | null; hidden: boolean; sort: number };

function flatten(doc: MenuDocument): { items: ItemRow[]; beans: BeanRow[] } {
  const items: ItemRow[] = [];
  const beans: BeanRow[] = [];
  for (const p of doc.pages) {
    if (p.mirror) continue; // skip A3 mirrors (would duplicate A4 content)
    walk(p.root, (b) => {
      if (b.type === "section" && !b.itemsFrom) {
        b.items.forEach((it, i) =>
          items.push({ id: it.id, page: p.id, section: b.titleEn, name_en: it.nameEn, name_kr: it.nameKr, price: it.price, badge: it.badge ?? null, descr: it.desc ?? null, sort: i }),
        );
      }
      if (b.type === "handdrip" && !b.beansFrom) {
        b.beans.forEach((bn, i) =>
          beans.push({ id: bn.id, name_en: bn.nameEn, grade: bn.grade ?? null, price: bn.price, head_copy: bn.headCopy ?? null, descr: bn.desc ?? null, hidden: !!bn.hidden, sort: i }),
        );
      }
    });
  }
  return { items, beans };
}

async function replaceAll(table: string, rows: unknown[]) {
  // delete-all then insert (a simple, reliable projection for a small menu)
  await fetch(`${REST}/${table}?id=not.is.null`, { method: "DELETE", headers });
  if (rows.length) await fetch(`${REST}/${table}`, { method: "POST", headers, body: JSON.stringify(rows) });
}

export async function projectToTables(doc: MenuDocument): Promise<void> {
  if (!tablesEnabled() || missing) return;
  try {
    const res = await fetch(`${REST}/menu_documents`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id: doc.id || "vivace", doc, updated_at: new Date().toISOString() }),
    });
    if (res.status === 404) { missing = true; return; } // tables not created yet — run supabase-tables.sql
    const { items, beans } = flatten(doc);
    await replaceAll("menu_items", items);
    await replaceAll("beans", beans);
  } catch {
    /* transient — ignore (the JSON sync is primary) */
  }
}
