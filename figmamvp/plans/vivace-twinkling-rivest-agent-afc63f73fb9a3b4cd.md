# Vivace Menu Management System — Implementation Architecture

Figma Make app (NOT plain Vite). Entry: `__figma__entrypoint__.ts` imports `./src/styles/index.css` and lazy-loads `src/app/App.tsx` (default export). All app code lives under `src/app/`. Styles under `src/styles/` (already wired: `index.css` -> `fonts.css` + `tailwind.css` + `theme.css`).

## Key facts established from the imports
- A4 base font sizes (from `VivaceMenu01A4All`): section title "Coffee" 84.033px, subtitle "Espresso Base" 44px, blend title 89.841px (A3) / proportional, blend body 54.449px (A3), 디카페인 note 82.09px (A4). Section divider stroke 2.626px (A4) / 3.575px (A3).
- A3 sizes are the A4 sizes x ~1.361 (e.g. 84.033 -> 114.388 confirmed: 114.388/84.033 = 1.3612). Stroke 2.626 -> 3.575 = 1.361. THIS IS THE SCALE FACTOR.
- The inconsistencies the user wants fixed (디카페인 note scaling 2x, alignment differing L/R) come from the section text being baked as multi-`<span>` strings with hardcoded px. The fix is to STOP using baked strings and drive everything from tokens x scale.
- All drink-item lists are empty placeholder divs (`MenuBlock1` / `Frame`). Items must be authored in the new data model.
- Logo SVG path data lives in `src/imports/VivaceMenu0XXX/svg-*.ts` as `{ pXX: "M..." }`. The A4 logo (`svg-o5zzswhb7v.ts`, viewBox 618.227x211.3) and A3 logo (`svg-scdhwuwm2b.ts`, viewBox 953.287x325.818) are the SAME artwork at different scale -> we keep ONE copy of the path set and render into a viewBox, scaling via the page scale factor.

---

## 1. Unified data model
File: `src/app/data/menu-types.ts`

```ts
export type Badge = "signature" | "Best";

export interface MenuItem {
  id: string;
  name: string;          // e.g. "Espresso"
  nameEn?: string;
  price: number;         // in thousand-won units, e.g. 4.5
  badges?: Badge[];
  note?: string;         // per-item note e.g. "Hot only"
}

export interface MenuSection {
  id: string;
  title: string;         // "Coffee"
  subtitle?: string;     // "Espresso Base"
  items: MenuItem[];
  // structural hints for layout, NOT styling:
  kind: "list" | "blend" | "handdrip";
}

export interface BlendDescription {
  id: "A" | "B";
  title: string;         // "[A] Blend"
  body: string;          // roasting description paragraph
}

export interface GlobalNotes {
  decaf: string;         // "디카페인 변경 가능합니다."
  shot: string;          // "샷 추가  + 1.0"
  iced?: string;         // "차갑게도 드실 수 있습니다."
  roastingPhilosophy: string[]; // "비바체에서는 생두가..." (array of lines)
}

export interface MenuData {
  version: number;
  sections: MenuSection[];   // Coffee/Espresso, Tea, Beverage, Filter/Handdrip
  blends: BlendDescription[];
  notes: GlobalNotes;
}
```

Seed data: `src/app/data/menu-seed.ts` — exports `defaultMenu: MenuData` with the real Korean text already present in the imports (blend bodies from A3L lines 50 & 155-158, roasting philosophy from A4All lines 153-155, decaf/shot from line 33-34) PLUS placeholder drink items authored fresh (the imports have none). This is the single source of truth.

---

## 2. Scale / token system (px-at-DPI for print fidelity)
File: `src/app/design/tokens.ts`

Approach: define ONE base token set in px at the A4 reference, plus paper dimensions in mm and a target DPI. Everything derives from `scale`.

```ts
// Paper at 96 CSS-px-per-inch baseline for screen; mm drives PDF output.
export const PAPER = {
  A4: { wMm: 210, hMm: 297 },
  A3: { wMm: 297, hMm: 420 },
};

export const A3_SCALE = 1.3612; // measured from imports

// Base tokens authored at A4 scale (scale = 1)
export const BASE_TOKENS = {
  sectionTitle: 84.033,
  sectionSubtitle: 44,
  blendTitle: 66,        // unified (import had 89.841 at A3 -> /1.3612 = 66 at A4)
  blendBody: 40,         // 54.449 / 1.3612
  noteText: 47,          // unify decaf/shot/iced to ONE size (kill the 2x bug)
  itemName: 40,
  itemPrice: 40,
  philosophy: 37,
  divider: 2.626,
  blendBorder: 3,
  badgeText: 18,
  gapSection: 36,
  pagePadX: 120,
  pagePadY: 140,
} as const;

export type Tokens = Record<keyof typeof BASE_TOKENS, number>;
export function tokensForScale(scale: number): Tokens { /* map v => v*scale, return px strings via helper */ }
```

A ScaleContext (`src/app/design/scale-context.tsx`) provides `{ scale, tokens, pageWidthPx, pageHeightPx }`. Page px dimension = mm -> px at a chosen render DPI constant (e.g. `PX_PER_MM = 3.7795` for 96dpi screen; PDF path uses mm directly so the same DOM scales cleanly). A4All/A4L/A4R wrap with `scale=1`; A3L/A3R wrap with `scale=A3_SCALE`. This makes A4 and A3 literally the same design at two scales, satisfying goal 1.

Rationale for px (not rem): print fidelity needs exact, scale-multiplied values; rem is tied to root font-size and fights html2canvas/jsPDF mm mapping.

---

## 3. Reusable presentational components
Folder: `src/app/components/menu/`
All read `tokens` from ScaleContext (no per-component scale prop needed; context = single knob).

- `VivaceLogo.tsx` — renders the logo from ONE shared path set. Move the path object out of `src/imports` into `src/app/components/menu/logo-paths.ts` (copy the `p*` values from `svg-o5zzswhb7v.ts`; they are scale-independent because they live in a viewBox). Component takes `viewBox="0 0 618.227 211.3"` and sizes via `width = tokens-driven`. Reuses the imported artwork without depending on import files.
- `SectionHeader.tsx` — title + optional subtitle + divider line. Replaces the baked multi-span strings; title/subtitle are separate flex children sized by `tokens.sectionTitle`/`sectionSubtitle`. Fixes alignment + 2x bugs.
- `MenuItemRow.tsx` — name (+ badges inline) ... dotted/space leader ... price. Renders `item.note` under name if present.
- `Badge.tsx` — the grey ellipse + white label ("signature"/"Best"). Reproduces the `<ellipse fill=#5B5B5B>` + Merge One text from imports, sized by `tokens.badgeText`.
- `BlendBox.tsx` — bordered box (`border` width = `tokens.blendBorder`), title `tokens.blendTitle`, body `tokens.blendBody`. One component used by both A and B blends.
- `NoteBlock.tsx` — renders decaf/shot/iced/philosophy at the UNIFIED `tokens.noteText`. Single component kills the per-variant divergence.

Fonts referenced inline in imports: `Kepler 3 VF Display` (font-[635], wdth 98 via `fontVariationSettings`), `Noto Sans KR`, `Merge One`, `Noto Sans Math`. Centralize as CSS classes (see section 9) instead of repeating long `font-[...]` strings.

---

## 4. Layout composition components
Folder: `src/app/components/pages/`

A `PageFrame.tsx` wrapper: fixed-size white page (`pageWidthPx` x `pageHeightPx` from context), `overflow-hidden`, absolutely-positioned logo, padding from tokens. Provides ScaleContext value.

Section grouping built from `MenuData.sections` filtered/ordered. Two reusable column builders:
- `MenuColumn.tsx` — renders an ordered list of sections (SectionHeader + items/blend/notes).

Five page components, all composed from the same sections:
- `PageA4All.tsx` — scale 1, two columns side by side (Coffee/Espresso/Beverage | Tea/Filter+Handdrip), all sections, logo top-left, full notes. Mirrors `VivaceMenu01A4All` structure.
- `PageA4L.tsx` — scale 1, left half of the split (Coffee/Espresso + blends + Tea).
- `PageA4R.tsx` — scale 1, right half (Beverage + Filter/Handdrip + roasting philosophy).
- `PageA3L.tsx` — scale A3_SCALE, same content split as A4L (mirrors `VivaceMenu03A3L`: two columns, A & B blend boxes, signature badge).
- `PageA3R.tsx` — scale A3_SCALE, BUT hand-drip section `expanded` to fill the full A3. Pass an `expand` prop to `MenuColumn`/handdrip section that increases handdrip item spacing / allocates remaining vertical space (flex-grow on the handdrip list) so it fills the page. This is the only structural delta among the five.

Split logic: a single `SECTION_LAYOUT` map (`src/app/data/section-layout.ts`) declares which section ids go on All / L / R, and which page expands handdrip. The five page components consume this map so content stays in sync from one place.

---

## 5. Editor
Folder: `src/app/editor/`

- State: `src/app/state/menu-store.tsx` — React Context + `useReducer` holding `MenuData`. Initialized from localStorage (`vivace.menu.v1`) falling back to `defaultMenu`. Auto-persists to localStorage on every change (debounced).
- `EditorPanel.tsx` — shadcn/ui `Tabs` (one tab per section + Blends + Notes). Uses `react-hook-form` (7.55.0) with the menu schema; `useFieldArray` for the item lists (add/remove/reorder drink items — handdrip especially, per goal 3). Inputs: shadcn `Input`/`Textarea`/`Select`/`Switch` (badges as multi-toggle). `form.tsx` already present in ui/.
- Live preview: Editor and Preview both read the SAME `menu-store` context. `react-hook-form` `watch()` dispatches to the store on change -> preview re-renders instantly. Split-screen: editor left, scaled live page right.
- Persistence (recommended default): localStorage + JSON import/export. `ImportExport.tsx` — download `menu.json` (Blob) and upload to replace store. Simple, zero-backend.
- Option (mention only): Supabase via the make:supabase skill for shared multi-device persistence — a single `menu_data` row (jsonb). Defer unless multi-device editing is required.

---

## 6. Web horizontal A3 L/R full-screen view (goal 2)
File: `src/app/components/ScaleToFit.tsx` + `src/app/pages-view/WebHorizontal.tsx`

- Pages are fixed-px (from tokens). To fill the viewport, wrap each page in `ScaleToFit`: measure container with `ResizeObserver`, compute `scale = min(containerW/pageW, containerH/pageH)`, apply `transform: scale(k); transform-origin: top left` to a wrapper sized to pageW/pageH. CSS transform keeps text crisp (vector) and preserves the exact internal layout.
- `WebHorizontal`: fl/ex row, A3L and A3R side by side, each ScaleToFit'd to ~half viewport width, full height — "wide horizontal presentation". Reuses `PageA3L`/`PageA3R` unchanged.

---

## 7. PDF export (goal 4 — 5 files)
File: `src/app/export/pdf-export.ts` + `ExportPanel.tsx`

Recommendation: **jsPDF + html2canvas** (must add `jspdf` and `html2canvas` to package.json — not yet installed; flag for `pnpm add`). Reason: we need exact A4/A3 mm page sizes and the layout is a styled DOM with variable fonts + SVG; react-to-print relies on the browser print dialog (less deterministic page sizing, user-driven). jsPDF lets us set `new jsPDF({ unit: 'mm', format: [210,297] })` (and [297,420] for A3) and place a high-DPI canvas via `addImage` covering the full page.

Flow per page:
1. Render the target page component off-screen at its native fixed-px size (a hidden render root, scale per page).
2. `html2canvas(node, { scale: dpiFactor })` — `dpiFactor` ~ 3-4 for ~300 DPI print.
3. `pdf.addImage(canvas, 'PNG', 0, 0, wMm, hMm)`; `pdf.save(filename)`.

Produce 5 files: `Vivace-A4-All.pdf`, `Vivace-A4-L.pdf`, `Vivace-A4-R.pdf`, `Vivace-A3-L.pdf`, `Vivace-A3-R.pdf`. Provide both "export all 5" (loop) and individual buttons. Optionally also a combined multi-page doc.

Fonts MUST be loaded before capture: `await document.fonts.ready` and ensure @font-face declared (section 9). html2canvas rasterizes computed styles, so fonts must be present in the document.

---

## 8. Routing
File: `src/app/App.tsx` (default export) + `src/app/routes.tsx`
Use react-router 7.13.0 (already installed) with `createMemoryRouter` or `createBrowserRouter`. (Follow make:react-router skill for the Make-specific setup.)

Routes:
- `/` -> `WebHorizontal` (A3 L/R full-screen preview) — goal 2.
- `/editor` -> `EditorPanel` + live preview — goal 3.
- `/export` -> `ExportPanel` (the 5 PDF buttons) — goal 4.
- `/preview/:layout` -> single page render (all|a4l|a4r|a3l|a3r) for inspection.

App wraps everything in `<MenuStoreProvider>` so all routes share one editable `MenuData`. A small top nav switches views.

---

## 9. Fonts
File: `src/styles/fonts.css` (currently EMPTY — this is why imports render with fallback fonts).
Add `@font-face` for: `Kepler 3 VF Display` (variable, weight/wdth axes — imports use font-[635], wdth 98), `Merge One`, `Noto Sans KR`, `Noto Sans Math`. Define utility classes (e.g. `.font-display`, `.font-body`, `.font-badge`) so menu components stop repeating the long `font-['Kepler_3_VF_Display:...']` strings.

RISK / user confirmation needed: **Kepler 3 VF Display** (Adobe) and **Merge One** are likely commercial / licensed; they may not be redistributable and can't be assumed available. Noto Sans KR / Noto Sans Math are open (Google). ACTION: confirm with the user whether they have license + font files for Kepler & Merge One, or choose open substitutes (e.g. a serif display + a geometric sans). Without the real fonts, text metrics shift and the px tokens (tuned to Kepler) will reflow.

---

## Phased implementation plan (file-by-file)

Phase 0 — deps & fonts
- package.json: add `jspdf`, `html2canvas` (flag `pnpm add`).
- `src/styles/fonts.css`: @font-face + font utility classes (pending font-license confirmation).

Phase 1 — data + tokens (foundation)
- `src/app/data/menu-types.ts`
- `src/app/data/menu-seed.ts`
- `src/app/data/section-layout.ts`
- `src/app/design/tokens.ts`
- `src/app/design/scale-context.tsx`

Phase 2 — presentational components
- `src/app/components/menu/logo-paths.ts` (copy from imports svg-o5zzswhb7v.ts)
- `src/app/components/menu/VivaceLogo.tsx`
- `src/app/components/menu/SectionHeader.tsx`
- `src/app/components/menu/MenuItemRow.tsx`
- `src/app/components/menu/Badge.tsx`
- `src/app/components/menu/BlendBox.tsx`
- `src/app/components/menu/NoteBlock.tsx`

Phase 3 — page layouts
- `src/app/components/pages/PageFrame.tsx`
- `src/app/components/pages/MenuColumn.tsx`
- `src/app/components/pages/PageA4All.tsx`, `PageA4L.tsx`, `PageA4R.tsx`, `PageA3L.tsx`, `PageA3R.tsx`

Phase 4 — state + editor
- `src/app/state/menu-store.tsx` (context + reducer + localStorage)
- `src/app/editor/EditorPanel.tsx`, `src/app/editor/ImportExport.tsx`

Phase 5 — views & routing
- `src/app/components/ScaleToFit.tsx`
- `src/app/pages-view/WebHorizontal.tsx`
- `src/app/routes.tsx`
- `src/app/App.tsx` (wire provider + router)

Phase 6 — export
- `src/app/export/pdf-export.ts`
- `src/app/export/ExportPanel.tsx`

---

## Risks
1. **Font availability/licensing** (highest): Kepler 3 VF Display + Merge One likely commercial. px tokens are tuned to Kepler metrics; substitute fonts will reflow. Confirm with user before Phase 1 tuning.
2. **Print scaling accuracy**: mm<->px mapping at chosen DPI must be consistent; verify a printed A4 measures 210mm. The A3=1.3612xA4 assumption derived from imports must hold for every token (spot-check blend/note).
3. **html2canvas fidelity with variable fonts**: html2canvas may not honor `font-variation-settings` (wdth 98, weight 635) reliably -> exported PDF could differ from screen. Mitigations: pre-load via `document.fonts.ready`, test early; fallback to a static instance of the font at the needed weight/width, or evaluate an SVG-based or `@react-pdf` path if fidelity fails.
4. **Korean text + `text-box-trim`**: imports use `text-box-trim`/`text-box-edge` (limited browser support) for tight cap alignment; html2canvas may ignore it, shifting baselines.

### Critical Files for Implementation
- /workspaces/default/code/src/app/data/menu-types.ts
- /workspaces/default/code/src/app/design/tokens.ts
- /workspaces/default/code/src/app/components/pages/PageFrame.tsx
- /workspaces/default/code/src/app/state/menu-store.tsx
- /workspaces/default/code/src/app/export/pdf-export.ts
