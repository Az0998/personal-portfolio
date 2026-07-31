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
        <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-10 text-center">
          <h2 className="font-display text-3xl font-bold mb-3 text-shadow">作品档案</h2>
          <p className="text-white/60">暂无作品，请前往后台添加</p>
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
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 text-shadow">
            作品档案
          </h2>

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
                {cat === "all"
                  ? "全部"
                  : WORK_CATEGORIES.find((c) => c.value === cat)?.label ?? cat}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {featured.length > 0 && (
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            {featured.map((work, i) => (
              <WorkCard key={work.id} work={work} index={i} large />
            ))}
          </div>
        )}

        {rest.length > 0 && (
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
