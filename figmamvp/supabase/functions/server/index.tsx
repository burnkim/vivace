import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-aabb2e08/health", (c) => {
  return c.json({ status: "ok" });
});

const MENU_KEY = "vivace:menu";

// Fetch the current menu document. Returns { menu: null } when unset.
app.get("/make-server-aabb2e08/menu", async (c) => {
  try {
    const menu = await kv.get(MENU_KEY);
    return c.json({ menu: menu ?? null });
  } catch (error) {
    console.log(`Error fetching Vivace menu from KV store: ${error}`);
    return c.json({ error: `Failed to fetch menu: ${error}` }, 500);
  }
});

// Save the whole menu document.
app.put("/make-server-aabb2e08/menu", async (c) => {
  try {
    const body = await c.req.json();
    if (!body || typeof body !== "object" || !body.menu) {
      return c.json({ error: "Request body must be { menu: MenuData }" }, 400);
    }
    await kv.set(MENU_KEY, body.menu);
    return c.json({ ok: true });
  } catch (error) {
    console.log(`Error saving Vivace menu to KV store: ${error}`);
    return c.json({ error: `Failed to save menu: ${error}` }, 500);
  }
});

Deno.serve(app.fetch);