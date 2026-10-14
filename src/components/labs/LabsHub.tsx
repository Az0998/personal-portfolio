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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="labs-kicker">Labs / 效果集成馆</p>
            <h1 className="text-balance">星图 · 视效 · 三维物理</h1>
            <p className="labs-lead text-pretty">
              把站点里好玩的运动、渲染与物理小品收成一座馆：从作品星轨逛到 Canvas
              实验室，再到 Three + Cannon 的刚体世界。任选一翼深入，或从亮点直达场景。
            </p>
          </motion.div>
          <motion.div
            className="labs-orbit"
            aria-hidden
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
          >
            <span className="labs-orbit-ring" />
            <span className="labs-orbit-ring labs-orbit-ring--2" />
            <span className="labs-orbit-core">✦</span>
            {LAB_WINGS.map((w, i) => (
              <span
                key={w.id}
                className={`labs-orbit-dot labs-orbit-dot--${i + 1}`}
                style={{ ["--dot-hue" as string]: w.hue }}
              >
                {w.emoji}
              </span>
            ))}
          </motion.div>
        </header>

        <section className="labs-wings" aria-label="实验室翼">
          {LAB_WINGS.map((wing, i) => (
            <motion.article
              key={wing.id}
              className="labs-wing"
              style={{ ["--wing-hue" as string]: wing.hue }}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <div className="labs-wing-top">
                <span className="labs-wing-emoji" aria-hidden>
                  {wing.emoji}
                </span>
                <div>
                  <p className="labs-wing-kicker">{wing.kicker}</p>
                  <h2>{wing.title}</h2>
                  <p className="labs-wing-tag">{wing.tagline}</p>
                </div>
              </div>
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
                进入本翼
                <span aria-hidden>→</span>
              </Link>
            </motion.article>
          ))}
        </section>

        <section className="labs-highlights" aria-label="亮点直达">
          <div className="labs-section-head">
            <h2>亮点直达</h2>
            <p>新加的好玩效果，一键跳进对应场景。</p>
          </div>
          <div className="labs-grid">
            {LAB_HIGHLIGHTS.map((h, i) => (
              <motion.div
                key={h.href}
                initial={{ opacity: 0, y: 10 }}
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
