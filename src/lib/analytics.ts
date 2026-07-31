"use client";

const SESSION_KEY = "portfolio_sid";

function sessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anon";
  }
}

type TrackPayload = {
  type: "pageview" | "click" | "attention" | "cta";
  path?: string;
  target?: string;
  label?: string;
  duration?: number;
  meta?: Record<string, unknown>;
};

const queue: TrackPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (!queue.length) return;
  const events = queue.splice(0, 40).map((e) => ({
    ...e,
    path: e.path || (typeof location !== "undefined" ? location.pathname : "/"),
    sessionId: sessionId(),
  }));
  const body = JSON.stringify({ events });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* ignore */
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 1200);
}

export function track(payload: TrackPayload) {
  queue.push(payload);
  if (queue.length >= 8) flush();
  else scheduleFlush();
}

export function trackClick(target: string, label?: string) {
  track({ type: "click", target, label });
}

export function trackCta(target: string, label?: string) {
  track({ type: "cta", target, label });
}

/** 区块注意力：进入视口计时，离开或卸载上报 */
export function observeAttention(el: Element | null, target: string) {
  if (!el || typeof IntersectionObserver === "undefined") return () => undefined;
  let enter = 0;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) enter = performance.now();
        else if (enter) {
          const duration = Math.round(performance.now() - enter);
          if (duration > 800) {
            track({ type: "attention", target, duration });
          }
          enter = 0;
        }
      });
    },
    { threshold: 0.35 }
  );
  io.observe(el);
  return () => {
    if (enter) {
      const duration = Math.round(performance.now() - enter);
      if (duration > 800) track({ type: "attention", target, duration });
    }
    io.disconnect();
  };
}

export function trackPageview() {
  track({ type: "pageview", path: typeof location !== "undefined" ? location.pathname : "/" });
}
