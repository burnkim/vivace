/**
 * Supabase connection config for the studio.
 *
 * The values default to the Vivace project so a DEPLOYED build always reaches
 * the cloud menu even when the host (e.g. Vercel) has no env vars set — that
 * was why the deployed app showed the default seed layout instead of the real
 * menu. Env vars still override (to point at a different project).
 *
 * The anon key is public BY DESIGN (Supabase client key; data is protected by
 * RLS, and the key already ships inside every client bundle). Hardcoding the
 * fallback here adds no new exposure.
 */
const DEFAULT_URL = "https://aytppefbgcofnrnhzwyc.supabase.co";
const DEFAULT_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dHBwZWZiZ2NvZm5ybmh6d3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODI3MjIsImV4cCI6MjA5Nzg1ODcyMn0.NmW4JXAi3WBmRw9JhOUrQ7-9ivmZgWOvtaWXNjP5VY4";
const DEFAULT_FUNCTION = "make-server-aabb2e08";

export const SUPABASE_URL = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL).replace(/\/$/, "");
export const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON;
export const SUPABASE_FUNCTION = (import.meta.env.VITE_SUPABASE_FUNCTION as string | undefined) || DEFAULT_FUNCTION;

export const isRemoteEnabled = () => Boolean(SUPABASE_URL && SUPABASE_ANON);
