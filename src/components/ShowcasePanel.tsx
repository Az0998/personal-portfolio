"use client";

import { Showcase } from "@/data/showcases";
import { motion } from "framer-motion";

const moodGlow: Record<Showcase["mood"], string> = {
  hydro: "from-aqua/30 to-aqua-deep/10",
  pet: "from-sakura/35 to-sakura-deep/10",
  tool: "from-aqua-soft/25 to-sakura/15",
  plant: "from-emerald-400/25 to-lime-300/10",
  field: "from-amber-300/20 to-orange-400/10",
  novel: "from-fuchsia-300/20 to-sakura/15",
  paper: "from-sky-300/20 to-indigo-300/10",
};

export function ShowcasePanel({ showcase }: { showcase: Showcase }) {
  return (
    <div className="space-y-10 mb-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${moodGlow[showcase.mood]} p-6 md:p-8`}
      >
        <div className="flex items-start gap-4">
          <span className="text-5xl animate-float">{showcase.heroEmoji}</span>
          <div>
            <p className="font-cute text-sakura-soft text-sm mb-2">作品演示舱</p>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">{showcase.tagline}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="anime-card p-6">
          <h3 className="font-display text-xl text-sakura-soft mb-4">亮点速览</h3>
          <ul className="space-y-3">
            {showcase.highlights.map((h) => (
              <li key={h} className="flex gap-3 text-ink-200">
                <span className="text-aqua mt-1">✦</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="anime-card p-6">
          <h3 className="font-display text-xl text-sakura-soft mb-4">技术栈</h3>
          <div className="flex flex-wrap gap-2">
            {showcase.stack.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-ink-200"
              >
                {s}
              </span>
            ))}
          </div>
          {showcase.galleryHints && (
            <div className="mt-6">
              <p className="text-sm text-ink-400 mb-3">可视化素材建议</p>
              <div className="grid grid-cols-2 gap-2">
                {showcase.galleryHints.map((g) => (
                  <div
                    key={g}
                    className="rounded-xl border border-dashed border-sakura/30 bg-sakura/5 px-3 py-4 text-center text-sm text-sakura-soft"
                  >
                    {g}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {showcase.metrics && showcase.metrics.length > 0 && (
        <section className="anime-card p-6 md:p-8">
          <h3 className="font-display text-xl text-sakura-soft mb-6">关键指标可视化</h3>
          <div className="space-y-5">
            {showcase.metrics.map((m) => (
              <div key={m.label}>
                <div className="flex items-end justify-between mb-2 gap-4">
                  <div>
                    <p className="text-sm text-ink-200">{m.label}</p>
                    {m.note && <p className="text-xs text-ink-400 mt-0.5">{m.note}</p>}
                  </div>
                  <span className="font-cute text-aqua text-lg">{m.display}</span>
                </div>
                <div className="metric-bar">
                  <div
                    className="metric-bar-fill transition-all duration-700"
                    style={{ width: `${Math.max(8, Math.min(100, m.value * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showcase.demo && showcase.demo.length > 0 && (
        <section className="anime-card p-6 md:p-8">
          <h3 className="font-display text-xl text-sakura-soft mb-6">演示流程</h3>
          <ol className="space-y-4">
            {showcase.demo.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-sakura to-aqua flex items-center justify-center font-cute text-sm text-night">
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium text-white mb-1">{step.title}</p>
                  <p className="text-sm text-ink-300 leading-relaxed">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
