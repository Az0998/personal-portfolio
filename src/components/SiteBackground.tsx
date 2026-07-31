"use client";

import { useEffect, useState } from "react";

const CANDIDATES = [
  "/media/pixiv/hero.webp",
  "/media/pixiv/hero.png",
  "/media/pixiv/hero.jpg",
  "/media/bg/hero-loli.jpg",
];

/** 一图流固定背景 + 轻微视差 */
export function SiteBackground() {
  const [src, setSrc] = useState(CANDIDATES[CANDIDATES.length - 1]);
  const [offset, setOffset] = useState(0);

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
    const onScroll = () => setOffset(window.scrollY * 0.12);
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
          transform: `translate3d(0, ${offset}px, 0) scale(1.08)`,
        }}
      />
      <div className="site-bg-veil" />
    </div>
  );
}
