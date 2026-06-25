import type { MenuDocument } from "../core/types";
import { SUPABASE_URL, SUPABASE_ANON, SUPABASE_FUNCTION, isRemoteEnabled } from "./supabase";

/**
 * Supabase sync for the studio document via the deployed Hono edge function's
 * /menu key. Connection config lives in ./supabase (with a public-by-design
 * fallback so deployed builds always reach the cloud). loadRemote only returns
 * a value that is actually a studio document (has `pages`), so legacy data on
 * the same key is ignored rather than corrupting the studio.
 */
const BASE = `${SUPABASE_URL}/functions/v1/${SUPABASE_FUNCTION}`;
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_ANON}` };

export { isRemoteEnabled };

function isStudioDoc(v: unknown): v is MenuDocument {
  return !!v && typeof v === "object" && Array.isArray((v as MenuDocument).pages) && Array.isArray((v as MenuDocument).fonts);
}

export async function loadRemote(): Promise<MenuDocument | null> {
  const res = await fetch(`${BASE}/menu`, { headers });
  if (!res.ok) throw new Error(`loadRemote failed (${res.status})`);
  const json = (await res.json()) as { menu: unknown };
  return isStudioDoc(json.menu) ? json.menu : null;
}

export async function saveRemote(doc: MenuDocument): Promise<void> {
  const res = await fetch(`${BASE}/menu`, { method: "PUT", headers, body: JSON.stringify({ menu: doc }) });
  if (!res.ok) throw new Error(`saveRemote failed (${res.status})`);
}
