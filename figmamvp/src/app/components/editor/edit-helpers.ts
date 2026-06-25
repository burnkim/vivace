import type { MenuData } from "../../data/menu-types";

/** Returns a deep-cloned MenuData after applying `fn` — keeps updates immutable. */
export function edit(data: MenuData, fn: (draft: MenuData) => void): MenuData {
  const next = structuredClone(data);
  fn(next);
  return next;
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

/** Move an array element from index `from` to `to` (in place). */
export function move<T>(arr: T[], from: number, to: number): void {
  if (to < 0 || to >= arr.length) return;
  const [el] = arr.splice(from, 1);
  arr.splice(to, 0, el);
}
