"use client";

import { useEffect, useState } from "react";

const CANDIDATES = [
  "/media/pixiv/hero.webp",
  "/media/pixiv/hero.jpg",
  "/media/pixiv/hero.png",
  "/media/bg/hero-loli.jpg",
];

/** 固定铺满视口；无 scroll 监听（动效走 CSS） */
export function SiteBackground() {
  const [src, setSrc] = useState(CANDIDATES[0]);

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

  return (
    <div className="site-bg" aria-hidden>
      <div
        className="site-bg-image"
        style={{ backgroundImage: `url(${src})` }}
      />
      <div className="site-bg-veil" />
      <div className="site-bg-grain" />
    </div>
  );
}
