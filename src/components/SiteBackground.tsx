"use client";

import { useEffect, useState } from "react";

const CANDIDATES = [
  "/media/pixiv/hero.webp",
  "/media/pixiv/hero.jpg",
  "/media/pixiv/hero.png",
  "/media/bg/hero-loli.jpg",
];

/** 固定铺满视口的背景：滚动时始终可见，仅做极轻视差 */
export function SiteBackground() {
  const [src, setSrc] = useState(CANDIDATES[0]);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of CANDIDATES) {
        const ok = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img.naturalWidth > 32);
          img.onerror = () => resolve(false);
          img.src = url;
        });
        if (ok && !cancelled) {
          setSrc(url);
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      // 限制在 0~24px，避免长页把背景「滚出视口」
      const y = Math.min(window.scrollY * 0.04, 24);
      setShift(y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="site-bg" aria-hidden>
      <div
        className="site-bg-image"
        style={{
          backgroundImage: `url(${src})`,
          transform: `translate3d(0, ${-shift}px, 0) scale(1.12)`,
        }}
      />
      <div className="site-bg-veil" />
      <div className="site-bg-grain" />
    </div>
  );
}
