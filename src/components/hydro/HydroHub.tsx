"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HydroDashboard } from "@/components/hydro/HydroDashboard";

type Tab = "info" | "studio" | "field";

function resolveTab(raw: string | null): Tab {
  if (raw === "studio" || raw === "bench" || raw === "workbench") return "studio";
  if (raw === "field") return "field";
  return "info";
}

const TABS: { id: Tab; label: string; src?: string }[] = [
  { id: "info", label: "水情态势" },
  { id: "studio", label: "室内台", src: "/hydrobench/studio/index.html?embed=1" },
  { id: "field", label: "户外台", src: "/hydrobench/field/index.html?embed=1" },
];

export function HydroHub() {
  const search = useSearchParams();
  const reduceMotion = useReducedMotion();
  const initial = useMemo(() => resolveTab(search.get("tab")), [search]);
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    setTab(initial);
  }, [initial]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  const active = TABS.find((t) => t.id === tab)!;
  const fade = reduceMotion
    ? { duration: 0 }
    : { duration: 0.16, ease: "easeOut" as const };

  return (
    <div className="hb-root">
      <header className="hb-top">
        <Link href="/" className="hb-back">
          ← 返回主站
        </Link>
        <div className="hb-brand">
          <span className="hb-mark" aria-hidden>
            水
          </span>
          <div>
            <div className="hb-title">智慧水利</div>
            <div className="hb-sub">态势 · 室内作业 · 户外应急</div>
          </div>
        </div>
        <div className="hb-tabs" role="tablist" aria-label="智慧水利模块">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
          <Link href="/watershed-map" className="hb-map-link" title="流域一张图 GIS">
            空间图
          </Link>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {tab === "info" ? (
          <motion.div
            key="info"
            className="hb-pane hb-pane-info"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={fade}
          >
            <div className="hydro-root">
              <HydroDashboard />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={tab}
            className="hb-pane"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={fade}
          >
            <iframe
              className="hb-frame"
              title={active.label}
              src={active.src}
              allow="clipboard-write"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
