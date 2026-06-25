import type { MenuData } from "../data/menu-types";

/**
 * Remote (Supabase) sync layer. Reads/writes the whole menu document through a
 * Hono edge function so edits sync across devices.
 *
 * OPT-IN: enabled only when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set
 * (see .env.example). With no env the app runs local-first (localStorage) and
 * never talks to any backend — so it works offline and doesn't write to a
 * project you don't own. The store falls back to localStorage if any call fails.
 */

const URL_ENV = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY_ENV = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const FUNCTION = (import.meta.env.VITE_SUPABASE_FUNCTION as string | undefined) ?? "make-server-aabb2e08";

const BASE = URL_ENV ? `${URL_ENV.replace(/\/$/, "")}/functions/v1/${FUNCTION}` : "";
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY_ENV ?? ""}`,
};

export function isRemoteEnabled(): boolean {
  return Boolean(URL_ENV && KEY_ENV);
}

export async function loadRemote(): Promise<MenuData | null> {
  const res = await fetch(`${BASE}/menu`, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`loadRemote failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as { menu: MenuData | null };
  return json.menu ?? null;
}

export async function saveRemote(data: MenuData): Promise<void> {
  const res = await fetch(`${BASE}/menu`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ menu: data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`saveRemote failed (${res.status}): ${text}`);
  }
}
