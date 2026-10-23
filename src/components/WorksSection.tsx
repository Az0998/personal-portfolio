"use client";

import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { WorkCard, WorkItem } from "@/components/WorkCard";
import {
  WORK_CATEGORIES,
  getCategoryLabel,
  resolveWorkCategory,
  orderedWorkCategories,
} from "@/lib/utils";
import {
  FEATURED_WORK_TITLES,
  HYDRO_LANES,
  getHydroLane,
  type HydroLane,
} from "@/lib/hydro-guide";
import { SIDE_PORTALS, SKILL_PORTALS } from "@/data/site-portals";
import Link from "next/link";
import { useMemo, useState } from "react";

interface WorksSectionProps {
  works: WorkItem[];
}

export function WorksSection({ works }: WorksSectionProps) {
  const [filter, setFilter] = useState<string>("all");
  const [laneFilter, setLaneFilter] = useState<HydroLane | "all">("all");

  const categories = useMemo(
    () => [
      "all",
      ...orderedWorkCategories(
        works.map((w) => resolveWorkCategory(w.title, w.category))
      ),
    ],
    [works]
  );

  const filtered = useMemo(() => {
    let list = works;
    if (filter !== "all") {
      list = list.filter((w) => resolveWorkCategory(w.title, w.category) === filter);
    }
    if (filter === "hydro" && laneFilter !== "all") {
      list = list.filter((w) => getHydroLane(w.title) === laneFilter);
    }
    return list;
  }, [works, filter, laneFilter]);

  /** 精选：work.featured。主链标题按 FEATURED_WORK_TITLES 排前。 */
  const featured = useMemo(() => {
    if (filter !== "all" && filter !== "hydro") return [];
    const pool = filter === "all" ? works : filtered;
    const picked = new Set<string>();
    const ordered: WorkItem[] = [];
    for (const t of FEATURED_WORK_TITLES) {
      const w = pool.find((item) => item.title === t && item.featured);
      if (w) {
        ordered.push(w);
        picked.add(w.id);
      }
    }
    for (const w of pool) {
      if (w.featured && !picked.has(w.id)) ordered.push(w);
    }
    return ordered;
  }, [works, filtered, filter]);

  const featuredIds = new Set(featured.map((w) => w.id));
  const rest = filtered.filter((w) => !featuredIds.has(w.id));

  const grouped = useMemo(() => {
    if (filter !== "all") return null;
    const map = new Map<string, WorkItem[]>();
    for (const w of rest) {
      const key = resolveWorkCategory(w.title, w.category);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return WORK_CATEGORIES.map((c) => ({
      key: c.value,
      label: c.label,
      items: map.get(c.value) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [rest, filter]);

  if (works.length === 0) {
    return (
      <section id="works" className="section-padding">
        <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-10 text-center">
          <h2 className="font-display text-3xl font-bold mb-3 text-shadow text-balance">作品档案</h2>
          <p className="text-white/60 mb-5 text-pretty">暂无作品，去后台添加第一条吧。</p>
          <Link href="/admin/works/new" className="btn-primary">
            前往后台添加
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section id="works" className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel rounded-[2rem] p-8 md:p-10 mb-8 text-center"
        >
          <p className="eyebrow mb-3">作品</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3 text-shadow text-balance">
            作品档案
          </h2>
          <p className="text-white/60 text-sm mb-4 max-w-xl mx-auto text-pretty">
            先看智慧水利主线，再浏览全部项目；互动演示与趣味玩法放在后面，不抢主线位置。
          </p>
          <p className="mb-6 flex flex-wrap justify-center gap-2">
            <Link href="/hydrobench" className="btn-primary text-sm">
              智慧水利
            </Link>
            <Link href="/atlas" className="btn-outline text-sm">
              作品展厅
            </Link>
            <Link href="/labs" className="btn-outline text-sm">
              互动演示
            </Link>
          </p>

          <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="作品分类">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                type="button"
                role="tab"
                aria-selected={filter === cat}
                onClick={() => {
                  setFilter(cat);
                  setLaneFilter("all");
                }}
                whileTap={{ scale: 0.96 }}
                whileHover={{ y: -1 }}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  filter === cat
                    ? "bg-[#e44c65] text-white shadow-sakura"
                    : "bg-white/10 text-white/75 hover:bg-white/20"
                }`}
              >
                {cat === "all" ? "全部" : getCategoryLabel(cat)}
              </motion.button>
            ))}
          </div>

          {filter === "hydro" && (
            <div
              className="flex flex-wrap justify-center gap-2 mt-4"
              role="group"
              aria-label="智慧水利子标签"
            >
              <button
                type="button"
                onClick={() => setLaneFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                  laneFilter === "all"
                    ? "bg-[#2ec4b6] text-[#041018] font-semibold"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                全部子标签
              </button>
              {HYDRO_LANES.map((lane) => (
                <button
                  key={lane}
                  type="button"
                  onClick={() => setLaneFilter(lane)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                    laneFilter === lane
                      ? "bg-[#2ec4b6] text-[#041018] font-semibold"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {lane}
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {featured.length > 0 && (
          <div className="mb-10">
            {(filter === "all" || filter === "hydro") && (
              <h3 className="font-display text-xl text-white/90 mb-4 px-1 text-shadow text-balance">
                精选 · 智慧水利主链
              </h3>
            )}
            <div className="grid md:grid-cols-2 gap-5">
              {featured.map((work, i) => (
                <WorkCard
                  key={work.id}
                  work={work}
                  index={i}
                  large={i === 0 && featured.length > 1}
                />
              ))}
            </div>
          </div>
        )}

        {filter === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10"
          >
            <h3 className="font-display text-xl text-white/90 mb-2 px-1 text-shadow text-balance">
              接着看这些
            </h3>
            <p className="text-sm text-white/50 mb-4 px-1 text-pretty">
              作品展厅浏览全部项目；互动演示里可亲手调参、旋转三维场景。
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {SKILL_PORTALS.map((p) => (
                <Link
                  key={p.id}
                  href={p.href}
                  className="glass-panel rounded-[1.35rem] px-5 py-5 border border-white/10 hover:border-white/25 transition-colors group"
                  style={{ ["--portal-hue" as string]: p.hue }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: `color-mix(in srgb, ${p.hue} 55%, transparent)` }}
                    >
                      <Icon icon={p.icon} width={22} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-lg text-white/95 group-hover:text-white">
                        {p.title}
                      </p>
                      <p className="text-sm text-white/55 mt-1 text-pretty">{p.blurb}</p>
                      <p className="text-xs mt-3 font-semibold" style={{ color: p.hue }}>
                        {p.cta} →
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {filter !== "all" && featured.length === 0 && rest.length === 0 && (
          <div className="glass-panel rounded-[2rem] p-10 text-center mb-8">
            <p className="text-white/70 mb-4">该分类暂无作品</p>
            <button type="button" className="btn-outline" onClick={() => setFilter("all")}>
              查看全部
            </button>
          </div>
        )}

        {filter === "all" && grouped
          ? grouped.map((group) => (
              <div key={group.key} className="mb-10">
                <div className="flex items-baseline justify-between gap-3 mb-4 px-1">
                  <h3 className="font-display text-xl text-white/90 text-shadow text-balance">
                    {group.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFilter(group.key)}
                    className="text-xs text-[#ff9aab] hover:text-white transition-colors duration-150"
                  >
                    只看此类 →
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.items.map((work, i) => (
                    <WorkCard key={work.id} work={work} index={i} />
                  ))}
                </div>
              </div>
            ))
          : rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rest.map((work, i) => (
                  <WorkCard key={work.id} work={work} index={i + featured.length} />
                ))}
              </div>
            )}

        {(filter === "all" || filter === "demo") &&
          SIDE_PORTALS.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-2 mb-8 glass-panel rounded-[1.5rem] px-6 py-5 md:px-8 border border-white/10"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs tracking-widest text-white/45 mb-1">趣味支线</p>
                  <h3 className="font-display text-lg md:text-xl text-white/90 text-shadow">
                    {p.title}
                  </h3>
                  <p className="text-sm text-white/55 mt-1 max-w-lg text-pretty">{p.blurb}</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Link href={p.href} className="btn-outline text-sm px-4 py-2">
                    {p.cta}
                  </Link>
                  {p.id === "life-sim" && (
                    <Link href="/cs-life" className="btn-outline text-sm px-4 py-2">
                      CS 线
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
      </div>
    </section>
  );
}
