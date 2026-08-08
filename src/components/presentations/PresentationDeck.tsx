"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Maximize2,
} from "lucide-react";
import type { DeckSlide, Presentation } from "@/data/presentations";

const moodAccent: Record<Presentation["mood"], string> = {
  hydro: "#5ec8e8",
  pet: "#ff9aab",
  tool: "#ffd6a8",
  plant: "#86efac",
  field: "#fbbf24",
  novel: "#e879f9",
  paper: "#93c5fd",
};

function SlideBody({ slide, accent }: { slide: DeckSlide; accent: string }) {
  if (slide.kind === "title") {
    return (
      <div className="deck-slide deck-slide--title">
        <p className="deck-kicker" style={{ color: accent }}>
          Project Briefing
        </p>
        <h1 className="deck-title">{slide.title}</h1>
        {slide.subtitle && <p className="deck-subtitle">{slide.subtitle}</p>}
        {slide.footer && <p className="deck-footer">{slide.footer}</p>}
      </div>
    );
  }

  if (slide.kind === "metrics" && slide.metrics) {
    return (
      <div className="deck-slide">
        <h2 className="deck-h2">{slide.title}</h2>
        <div className="deck-metrics">
          {slide.metrics.map((m) => (
            <div key={m.label} className="deck-metric">
              <p className="deck-metric__value" style={{ color: accent }}>
                {m.value}
              </p>
              <p className="deck-metric__label">{m.label}</p>
              {m.note && <p className="deck-metric__note">{m.note}</p>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slide.kind === "steps" && slide.steps) {
    return (
      <div className="deck-slide">
        <h2 className="deck-h2">{slide.title}</h2>
        <ol className="deck-steps">
          {slide.steps.map((s, i) => (
            <li key={s.title}>
              <span className="deck-steps__n" style={{ background: accent }}>
                {i + 1}
              </span>
              <div>
                <p className="deck-steps__t">{s.title}</p>
                <p className="deck-steps__d">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (slide.kind === "stack") {
    return (
      <div className="deck-slide">
        <h2 className="deck-h2">{slide.title}</h2>
        {slide.chips && (
          <div className="deck-chips">
            {slide.chips.map((c) => (
              <span key={c} className="deck-chip" style={{ borderColor: `${accent}66` }}>
                {c}
              </span>
            ))}
          </div>
        )}
        {slide.bullets && (
          <ul className="deck-bullets deck-bullets--soft">
            {slide.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="deck-slide">
      <h2 className="deck-h2">{slide.title}</h2>
      {slide.subtitle && <p className="deck-lead">{slide.subtitle}</p>}
      {slide.bullets && (
        <ul className="deck-bullets">
          {slide.bullets.map((b) => (
            <li key={b}>
              <span style={{ color: accent }}>✦</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
      {slide.footer && <p className="deck-footer">{slide.footer}</p>}
    </div>
  );
}

export function PresentationDeck({ deck }: { deck: Presentation }) {
  const [index, setIndex] = useState(0);
  const total = deck.slides.length;
  const accent = moodAccent[deck.mood];
  const slide = deck.slides[index];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)));
    },
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Home") {
        setIndex(0);
      } else if (e.key === "End") {
        setIndex(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  return (
    <div className="deck" style={{ ["--deck-accent" as string]: accent }}>
      <header className="deck-top">
        <Link href="/#works" className="deck-back">
          <ArrowLeft className="w-4 h-4" />
          作品集
        </Link>
        <div className="deck-top__meta">
          <span aria-hidden>{deck.emoji}</span>
          <span className="truncate">{deck.title}</span>
        </div>
        <div className="deck-top__actions">
          {deck.demoHref && (
            <a href={deck.demoHref} className="deck-mini-btn">
              <ExternalLink className="w-3.5 h-3.5" />
              演示
            </a>
          )}
          {deck.github && (
            <a href={deck.github} target="_blank" rel="noopener noreferrer" className="deck-mini-btn">
              <Github className="w-3.5 h-3.5" />
              源码
            </a>
          )}
        </div>
      </header>

      <div
        className="deck-stage"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x > rect.width * 0.62) go(1);
          else if (x < rect.width * 0.38) go(-1);
        }}
      >
        <div key={index} className="deck-frame">
          <SlideBody slide={slide} accent={accent} />
        </div>
      </div>

      <footer className="deck-bottom">
        <button
          type="button"
          className="deck-nav-btn"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="上一页"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="deck-dots" role="tablist" aria-label="幻灯片进度">
          {deck.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={`deck-dot ${i === index ? "is-active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`第 ${i + 1} 页`}
            />
          ))}
        </div>
        <p className="deck-page tabular">
          {index + 1} / {total}
        </p>
        <button
          type="button"
          className="deck-nav-btn"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label="下一页"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        {index === total - 1 && deck.demoHref && (
          <a href={deck.demoHref} className="deck-cta">
            <Maximize2 className="w-4 h-4" />
            打开演示
          </a>
        )}
      </footer>
    </div>
  );
}
