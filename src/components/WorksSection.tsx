"use client";

import { motion } from "framer-motion";
import { WorkCard, WorkItem } from "@/components/WorkCard";
import { WORK_CATEGORIES } from "@/lib/utils";
import { useState } from "react";

interface WorksSectionProps {
  works: WorkItem[];
}

export function WorksSection({ works }: WorksSectionProps) {
  const [filter, setFilter] = useState<string>("all");

  const categories = ["all", ...new Set(works.map((w) => w.category))];
  const filtered = filter === "all" ? works : works.filter((w) => w.category === filter);

  const featured = filtered.filter((w) => w.featured);
  const rest = filtered.filter((w) => !w.featured);

  if (works.length === 0) {
    return (
      <section id="works" className="section-padding">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            精选<span className="gradient-text">作品</span>
          </h2>
          <p className="text-ink-400">暂无作品，请前往后台添加</p>
        </div>
      </section>
    );
  }

  return (
    <section id="works" className="section-padding">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            精选<span className="gradient-text">作品</span>
          </h2>
          <p className="text-ink-400 mb-8">每个项目都有介绍、演示流程与可视化</p>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-all font-cute ${
                  filter === cat
                    ? "bg-gradient-to-r from-sakura to-aqua text-night"
                    : "glass text-ink-300 hover:text-white hover:border-sakura/40"
                }`}
              >
                {cat === "all"
                  ? "全部"
                  : WORK_CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
              </button>
            ))}
          </div>
        </motion.div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {featured.map((work, i) => (
              <WorkCard key={work.id} work={work} index={i} large />
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((work, i) => (
              <WorkCard key={work.id} work={work} index={i + featured.length} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
