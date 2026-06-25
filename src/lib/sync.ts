import type { MenuDocument } from "../core/types";

/**
 * Supabase sync for the studio document. Opt-in via env (VITE_SUPABASE_URL +
 * VITE_SUPABASE_ANON_KEY); local-first otherwise. Reuses the deployed Hono edge
 * function's /menu key. loadRemote only returns a value that is actually a
 * studio document (has `pages`), so legacy data on the same key is ignored
 * rather than corrupting the studio.
 */
const URL_ENV = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ENV = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const FUNCTION = (import.meta.env.VITE_SUPABASE_FUNCTION as string | undefined) ?? "make-server-aabb2e08";

const BASE = URL_ENV ? `${URL_ENV.replace(/\/$/, "")}/functions/v1/${FUNCTION}` : "";
const headers = { "Content-Type": "application/json", Authorization: `Bearer ${KEY_ENV ?? ""}` };

export const isRemoteEnabled = () => Boolean(URL_ENV && KEY_ENV);

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
