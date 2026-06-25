/**
 * One-off: push the corrected MENU_SEED to the Supabase cloud copy, making it
 * the canonical version. Run with Bun from the figmamvp dir (auto-loads .env):
 *   bun scripts/push-seed.ts
 */
import { MENU_SEED } from "../src/app/data/menu-seed";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const fn = process.env.VITE_SUPABASE_FUNCTION ?? "make-server-aabb2e08";

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (check .env).");
  process.exit(1);
}

const endpoint = `${url.replace(/\/$/, "")}/functions/v1/${fn}/menu`;
const res = await fetch(endpoint, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify({ menu: MENU_SEED }),
});
console.log(`PUT ${endpoint}`);
console.log(`-> ${res.status} ${await res.text()}`);
