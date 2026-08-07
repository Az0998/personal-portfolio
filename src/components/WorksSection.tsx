"use client";

import { motion } from "framer-motion";
import { WorkCard, WorkItem } from "@/components/WorkCard";
import {
  WORK_CATEGORIES,
  getCategoryLabel,
  resolveWorkCategory,
  orderedWorkCategories,
} from "@/lib/utils";
import Link from "next/link";
import { useMemo, useState } from "react";

interface WorksSectionProps {
  works: WorkItem[];
}

/** 精选优先标题（库里 featured 未更新时仍保证主推位） */
const FEATURED_TITLES = [
  "HydroInfo 流域水情信息平台",
  "HydroBench · 水文双工作台",
  "波托马克河多时效径流深度学习预报",
  "匿名问卷 · 分发填写与汇总",
];

export function WorksSection({ works }: WorksSectionProps) {
  const [filter, setFilter] = useState<string>("all");

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
    if (filter === "all") return works;
    return works.filter((w) => resolveWorkCategory(w.title, w.category) === filter);
  }, [works, filter]);

  const featured = useMemo(() => {
    const byFlag = filtered.filter((w) => w.featured);
    const byTitle = FEATURED_TITLES.map((t) => filtered.find((w) => w.title === t)).filter(
      Boolean
    ) as WorkItem[];
    const merged = [...byTitle, ...byFlag.filter((w) => !byTitle.some((x) => x.id === w.id))];
    return merged.slice(0, 4);
  }, [filtered]);
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
          <p className="eyebrow mb-3">Works</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-3 text-shadow text-balance">
            作品档案
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-xl mx-auto text-pretty">
            按智慧水利、在线演示、论文与工具分组浏览
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
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
        </motion.div>

        {featured.length > 0 && (
          <div className="mb-10">
            {filter === "all" && (
              <h3 className="font-display text-xl text-white/90 mb-4 px-1 text-shadow text-balance">
                精选
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
      </div>
    </section>
  );
}
