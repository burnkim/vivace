import type { MenuData } from "./menu-types";

/** Parsed group reference. */
export type ParsedGroup =
  | { kind: "section"; id: string }
  | { kind: "blend"; id: string }
  | { kind: "handdrip" }
  | { kind: "handdrip-compact" }
  | { kind: "note"; id: "espresso" };

export function parseGroup(g: string): ParsedGroup | null {
  if (g === "handdrip") return { kind: "handdrip" };
  if (g === "handdrip-compact") return { kind: "handdrip-compact" };
  if (g.startsWith("section:")) return { kind: "section", id: g.slice(8) };
  if (g.startsWith("blend:")) return { kind: "blend", id: g.slice(6) };
  if (g.startsWith("note:")) return { kind: "note", id: "espresso" };
  return null;
}

/** Human label for a group id (for the editor chips / pickers). */
export function groupLabel(g: string, data: MenuData): string {
  const p = parseGroup(g);
  if (!p) return g;
  switch (p.kind) {
    case "section":
      return data.sections.find((s) => s.id === p.id)?.titleEn ?? `Section: ${p.id}`;
    case "blend":
      return data.blends.find((b) => b.id === p.id)?.label ?? `Blend: ${p.id}`;
    case "handdrip":
      return "핸드드립 (전체)";
    case "handdrip-compact":
      return "핸드드립 (압축)";
    case "note":
      return "안내문 (디카페인)";
  }
}

/** Every group id that can be placed, for the "add group" picker. */
export function allGroupIds(data: MenuData): string[] {
  return [
    ...data.sections.map((s) => `section:${s.id}`),
    ...data.blends.map((b) => `blend:${b.id}`),
    "handdrip",
    "handdrip-compact",
    "note:espresso",
  ];
}
