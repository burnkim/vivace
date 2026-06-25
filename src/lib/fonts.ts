import type { FontDef } from "../core/types";

const loaded = new Set<string>(["Playfair Display", "Pretendard"]);

/** Inject a Google Fonts <link> once. */
function loadGoogle(family: string) {
  const linkId = `gf-${family.replace(/\s+/g, "-")}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  // Only request 400/700 — weights virtually every family (incl. Korean static
  // fonts) ships. Requesting weights a font lacks 400s the whole css2 response;
  // 500/800 etc. are font-synthesized by the browser.
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, "+")}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

/** Inject an Adobe Fonts (Typekit) kit once. */
function loadAdobe(kitId: string) {
  const linkId = `tk-${kitId}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = `https://use.typekit.net/${kitId}.css`;
  document.head.appendChild(link);
}

/** Ensure every font referenced by the document is loaded. */
export function ensureFonts(fonts: FontDef[]) {
  for (const f of fonts) {
    if (loaded.has(f.family) && f.source !== "adobe") continue;
    if (f.source === "google") loadGoogle(f.family);
    else if (f.source === "adobe" && f.href) loadAdobe(f.href);
    else if (f.source === "custom" && f.href) {
      // @font-face for an uploaded file
      const styleId = `cf-${f.family.replace(/\s+/g, "-")}`;
      if (!document.getElementById(styleId)) {
        const s = document.createElement("style");
        s.id = styleId;
        s.textContent = `@font-face{font-family:'${f.family}';src:url('${f.href}');font-display:swap;}`;
        document.head.appendChild(s);
      }
    }
    loaded.add(f.family);
  }
}

/** Load a single family by name (used when the user picks a Google font). */
export function ensureGoogleFamily(family: string) {
  if (!family || loaded.has(family)) return;
  loadGoogle(family);
  loaded.add(family);
}
