"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LAB_HIGHLIGHTS, LAB_WINGS } from "@/data/labs";
import { trackClick, trackPageview } from "@/lib/analytics";

export function LabsHub() {
  useEffect(() => {
    trackPageview();
  }, []);

  return (
    <div className="labs-root">
      <div className="labs-shell">
        <header className="labs-hero">
          <motion.div
            className="labs-hero-copy"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="labs-kicker">互动演示</p>
            <h1 className="text-balance">可逛、可调、可玩</h1>
            <p className="labs-lead text-pretty">
              先看作品展厅了解项目全貌，再进入平面动画与三维物理——边调参数边看结果，逻辑清楚，画面也讲究。
            </p>
            <ol className="labs-steps" aria-label="推荐浏览顺序">
              <li>
                <span>1</span>
                作品展厅 · 浏览项目
              </li>
              <li>
                <span>2</span>
                平面动画 · 调参观察
              </li>
              <li>
                <span>3</span>
                三维物理 · 旋转体验
              </li>
            </ol>
          </motion.div>

          <motion.div
            className="labs-hero-visual"
            aria-hidden
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="labs-panel">
              <div className="labs-panel-glow" />
              <div className="labs-panel-grid" />
              <div className="labs-panel-orb labs-panel-orb--a" />
              <div className="labs-panel-orb labs-panel-orb--b" />
              <div className="labs-panel-orb labs-panel-orb--c" />
              <p className="labs-panel-caption">即时演算 · 可调参数 · 三维刚体</p>
            </div>
          </motion.div>
        </header>

        <section className="labs-wings" aria-label="三个入口">
          {LAB_WINGS.map((wing, i) => (
            <motion.article
              key={wing.id}
              className="labs-wing"
              style={{ ["--wing-hue" as string]: wing.hue }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.42, delay: i * 0.07 }}
            >
              <div className="labs-wing-index">{String(i + 1).padStart(2, "0")}</div>
              <p className="labs-wing-kicker">{wing.kicker}</p>
              <h2>{wing.title}</h2>
              <p className="labs-wing-tag">{wing.tagline}</p>
              <p className="labs-wing-blurb text-pretty">{wing.blurb}</p>
              <ul className="labs-tech">
                {wing.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className="labs-samples">
                {wing.samples.map((s) => (
                  <Link
                    key={s.href}
                    href={s.href}
                    onClick={() => trackClick("labs-sample", s.label)}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
              <Link
                href={wing.href}
                className="labs-enter"
                onClick={() => trackClick("labs-enter", wing.id)}
              >
                开始体验
                <span aria-hidden>→</span>
              </Link>
            </motion.article>
          ))}
        </section>

        <section className="labs-highlights" aria-label="精选场景">
          <div className="labs-section-head">
            <h2>精选场景</h2>
            <p>观感与交互都更完整的几条，点进去即可玩。</p>
          </div>
          <div className="labs-grid">
            {LAB_HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.href}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={h.href}
                  className="labs-chip"
                  style={{ ["--chip-hue" as string]: h.hue }}
                  onClick={() => trackClick("labs-highlight", h.title)}
                >
                  <strong>{h.title}</strong>
                  <span>{h.note}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
