"use client";

import { useEffect, useState } from "react";

const CANDIDATES = [
  "/media/pixiv/hero.webp",
  "/media/pixiv/hero.png",
  "/media/pixiv/hero.jpg",
  "/media/bg/hero-loli.jpg",
];

/** 一图流固定背景：优先 Pixiv 自备图，否则默认 ACG 壁纸 */
export function SiteBackground() {
  const [src, setSrc] = useState(CANDIDATES[CANDIDATES.length - 1]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of CANDIDATES) {
        try {
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
        } catch {
          /* next */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="site-bg" aria-hidden>
      <div className="site-bg-image" style={{ backgroundImage: `url(${src})` }} />
      <div className="site-bg-veil" />
    </div>
  );
}
