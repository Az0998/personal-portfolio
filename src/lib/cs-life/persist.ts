import type { PlayerState, SharePack } from "./types";

const KEY = "cs-life:v1";

export function saveLocal(player: PlayerState, phase: string) {
  if (typeof window === "undefined") return;
  const pack = { phase, player, savedAt: new Date().toISOString() };
  localStorage.setItem(KEY, JSON.stringify(pack));
}

export function loadLocal(): { phase: string; player: PlayerState } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j?.player) return null;
    return { phase: j.phase, player: j.player };
  } catch {
    return null;
  }
}

export function clearLocal() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}

export function encodeShare(player: PlayerState): string {
  const pack: SharePack = { v: 2, createdAt: new Date().toISOString(), player };
  const json = JSON.stringify(pack);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeShare(code: string): SharePack | null {
  try {
    const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4));
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const json = decodeURIComponent(escape(atob(b64)));
    const pack = JSON.parse(json) as SharePack;
    if ((pack?.v !== 1 && pack?.v !== 2) || !pack.player) return null;
    return pack;
  } catch {
    return null;
  }
}

export function shareUrl(player: PlayerState): string {
  const code = encodeShare(player);
  if (typeof window === "undefined") return `/cs-life?snap=${code}`;
  return `${window.location.origin}/cs-life?snap=${code}`;
}
