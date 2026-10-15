"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  VIZ_SCENES,
  VIZ_BY_ID,
  defaultParams,
  type VizSceneId,
} from "@/data/viz-lab";
import { VIZ_DISPLAY_ORDER, orderByIds } from "@/data/site-portals";
import { trackClick, trackPageview } from "@/lib/analytics";
import { VizCanvas } from "@/components/viz-lab/VizCanvas";

const SCENES = orderByIds(VIZ_SCENES, VIZ_DISPLAY_ORDER);

function sceneFromSearch(raw: string | null): VizSceneId | null {
  if (!raw) return null;
  return VIZ_BY_ID.has(raw as VizSceneId) ? (raw as VizSceneId) : null;
}

export function VizLabApp() {
  const search = useSearchParams();
  const [sceneId, setSceneId] = useState<VizSceneId>(
    () => sceneFromSearch(search.get("scene")) ?? "hydrograph"
  );
  const scene = VIZ_BY_ID.get(sceneId) ?? SCENES[0];
  const [params, setParams] = useState(() => defaultParams(scene));
  const [paused, setPaused] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    trackPageview();
  }, []);

  useEffect(() => {
    setParams(defaultParams(scene));
    setResetToken((n) => n + 1);
  }, [scene]);

  const pick = (id: VizSceneId) => {
    setSceneId(id);
    trackClick("viz-scene", id);
  };

  useEffect(() => {
    const qs = `?scene=${sceneId}`;
    if (window.location.search !== qs) {
      window.history.replaceState(null, "", `/viz-lab${qs}`);
    }
  }, [sceneId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const i = SCENES.findIndex((s) => s.id === sceneId);
      if (e.key === "ArrowRight" && i >= 0) {
        const next = SCENES[(i + 1) % SCENES.length].id;
        setSceneId(next);
        trackClick("viz-scene", next);
      }
      if (e.key === "ArrowLeft" && i >= 0) {
        const next = SCENES[(i - 1 + SCENES.length) % SCENES.length].id;
        setSceneId(next);
        trackClick("viz-scene", next);
      }
      if (e.key === " ") {
        e.preventDefault();
        setPaused((p) => !p);
      }
      if (e.key === "r" || e.key === "R") setResetToken((n) => n + 1);
      const n = Number(e.key);
      if (n >= 1 && n <= Math.min(9, SCENES.length)) {
        const next = SCENES[n - 1].id;
        setSceneId(next);
        trackClick("viz-scene", next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneId]);

  const paramList = useMemo(() => scene.params, [scene]);

  return (
    <div className="viz-root">
      <div className="viz-shell">
        <header className="viz-hero">
          <div>
            <p className="viz-kicker">平面动画</p>
            <h1 className="text-balance">边调参数，边看结果</h1>
            <p className="viz-lead text-pretty">
              十八个即时演算场景：从降雨过程、混沌轨迹到斑图、布料与烟花。点上方标签切换，右侧滑块实时生效。
            </p>
          </div>
          <div className="viz-actions">
            <button type="button" className={paused ? "is-on" : ""} onClick={() => setPaused((p) => !p)}>
              {paused ? "继续" : "暂停"}
            </button>
            <button
              type="button"
              onClick={() => {
                setParams(defaultParams(scene));
                setResetToken((n) => n + 1);
              }}
            >
              重置
            </button>
            <a className="ghost" href="/labs">
              全部演示
            </a>
            <a className="ghost" href="/physics-3d">
              三维物理
            </a>
          </div>
        </header>

        <div className="viz-tabs" role="tablist" aria-label="场景">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === sceneId}
              className={s.id === sceneId ? "is-on" : ""}
              style={{ ["--viz-hue" as string]: s.hue }}
              onClick={() => pick(s.id)}
              title={`${i + 1}. ${s.tagline}`}
            >
              <span aria-hidden>{s.emoji}</span>
              {s.title}
            </button>
          ))}
        </div>

        <div className="viz-stage">
          <div className="viz-viewport" style={{ ["--viz-hue" as string]: scene.hue }}>
            <VizCanvas
              sceneId={sceneId}
              params={params}
              paused={paused}
              resetToken={resetToken}
            />
            <p className="viz-hint">
              {scene.id === "fluid" || scene.id === "reaction" || scene.id === "fireworks"
                ? "点击画面可互动 · "
                : scene.id === "cloth"
                  ? "按住拖拽布料 · "
                  : scene.id === "cosmos"
                    ? "拖拽转动视角 · "
                    : ""}
              ← → 换场景 · 空格暂停 · R 重置
            </p>
          </div>

          <aside className="viz-dock" aria-live="polite">
            <p className="viz-kicker">
              {scene.emoji} 场景 {SCENES.findIndex((s) => s.id === sceneId) + 1}/{SCENES.length}
            </p>
            <h2 className="text-balance">{scene.title}</h2>
            <p className="tagline text-pretty">{scene.tagline}</p>
            <p className="blurb text-pretty">{scene.blurb}</p>

            <div className="viz-params">
              {paramList.map((p) => (
                <label key={p.key} className="viz-param">
                  <span>
                    {p.label}
                    <b className="tabular">{formatParam(params[p.key] ?? p.default)}</b>
                  </span>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={params[p.key] ?? p.default}
                    onChange={(e) =>
                      setParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))
                    }
                  />
                </label>
              ))}
            </div>

            <ul className="viz-list">
              <li>画面在浏览器里即时演算，调参立刻生效。</li>
              <li>若系统开启「减少动态效果」，会自动降低计算量。</li>
              <li>点重置可回到该场景的默认状态。</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

function formatParam(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
