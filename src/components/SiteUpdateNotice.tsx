"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CURRENT_UPDATE } from "@/data/site-updates";

const storageKey = `site-update:${CURRENT_UPDATE.id}`;

export function SiteUpdateNotice({
  variant = "home",
}: {
  variant?: "home" | "hydro";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) === "1") return;
    } catch {
      /* private mode */
    }
    setOpen(true);
  }, []);

  if (!open) return null;

  function dismiss() {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  const hydro = variant === "hydro";

  return (
    <div
      className={hydro ? "site-update site-update-hydro" : "site-update site-update-home"}
      role="status"
    >
      <p>
        <strong>升级 · {CURRENT_UPDATE.date}</strong>
        {` ${CURRENT_UPDATE.lead}`}
      </p>
      <span className="site-update-actions">
        <a href="http://47.109.64.111:8080/">课上七步（阿里云）</a>
        <Link href="/sfl-lab">本站课堂</Link>
        <Link href="/updates">公告全文</Link>
        <button type="button" onClick={dismiss}>
          知道了
        </button>
      </span>
    </div>
  );
}
