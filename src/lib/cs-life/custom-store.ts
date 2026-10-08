import type { CustomEventDef } from "./types";

const KEY = "cs-life:custom-events:v1";

export function loadCustoms(): CustomEventDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustoms(list: CustomEventDef[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}
