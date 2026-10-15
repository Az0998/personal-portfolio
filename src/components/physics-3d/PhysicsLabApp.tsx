"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PHYS_SCENES,
  PHYS_BY_ID,
  defaultPhysParams,
  type PhysSceneId,
} from "@/data/physics-3d";
import { PHYS_DISPLAY_ORDER, orderByIds } from "@/data/site-portals";
import { trackClick, trackPageview } from "@/lib/analytics";
import { PhysicsCanvas } from "@/components/physics-3d/PhysicsCanvas";

const SCENES = orderByIds(PHYS_SCENES, PHYS_DISPLAY_ORDER);

function sceneFromSearch(raw: string | null): PhysSceneId | null {
  if (!raw) return null;
  return PHYS_BY_ID.has(raw as PhysSceneId) ? (raw as PhysSceneId) : null;
}

export function PhysicsLabApp() {
  const search = useSearchParams();
  const [sceneId, setSceneId] = useState<PhysSceneId>(
    () => sceneFromSearch(search.get("scene")) ?? "collide"
  );
  const scene = PHYS_BY_ID.get(sceneId) ?? SCENES[0];
  const [params, setParams] = useState(() => defaultPhysParams(scene));
  const [paused, setPaused] = useState(false);
  const [resetToken, setResetToken] = useState(0);

  useEffect(() => {
    trackPageview();
  }, []);

  useEffect(() => {
    setParams(defaultPhysParams(scene));
    setResetToken((n) => n + 1);
  }, [scene]);

  useEffect(() => {
    const qs = `?scene=${sceneId}`;
    if (window.location.search !== qs) {
      window.history.replaceState(null, "", `/physics-3d${qs}`);
    }
  }, [sceneId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const i = SCENES.findIndex((s) => s.id === sceneId);
      if (e.key === "ArrowRight" && i >= 0) {
        const next = SCENES[(i + 1) % SCENES.length].id;
        setSceneId(next);
        trackClick("phys-scene", next);
      }
      if (e.key === "ArrowLeft" && i >= 0) {
        const next = SCENES[(i - 1 + SCENES.length) % SCENES.length].id;
        setSceneId(next);
        trackClick("phys-scene", next);
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
        trackClick("phys-scene", next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sceneId]);

  const pick = (id: PhysSceneId) => {
    setSceneId(id);
    trackClick("phys-scene", id);
  };

  const paramList = useMemo(() => scene.params, [scene]);

  return (
    <div className="phys-root">
      <div className="phys-shell">
        <header className="phys-hero">
          <div>
            <p className="phys-kicker">三维物理</p>
            <h1 className="text-balance">可旋转的刚体小世界</h1>
            <p className="phys-lead text-pretty">
              八个场景：球堆碰撞、斜面滑动、水面浮力、绳链、磁力、喷泉与沙盒。拖拽旋转视角，右侧滑块改重力与弹性。
            </p>
          </div>
          <div className="phys-actions">
            <button type="button" className={paused ? "is-on" : ""} onClick={() => setPaused((p) => !p)}>
              {paused ? "继续" : "暂停"}
            </button>
            <button
              type="button"
              onClick={() => {
                setParams(defaultPhysParams(scene));
                setResetToken((n) => n + 1);
              }}
            >
              重置
            </button>
            <a className="ghost" href="/labs">
              全部演示
            </a>
            <a className="ghost" href="/viz-lab">
              平面动画
            </a>
          </div>
        </header>

        <div className="phys-tabs" role="tablist" aria-label="物理场景">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === sceneId}
              className={s.id === sceneId ? "is-on" : ""}
              style={{ ["--phys-hue" as string]: s.hue }}
              onClick={() => pick(s.id)}
            >
              <span aria-hidden>{s.emoji}</span>
              {s.title}
            </button>
          ))}
        </div>

        <div className="phys-stage">
          <div className="phys-viewport" style={{ ["--phys-hue" as string]: scene.hue }}>
            <PhysicsCanvas
              sceneId={sceneId}
              params={params}
              paused={paused}
              resetToken={resetToken}
            />
            <p className="phys-hint">
              {sceneId === "sandbox" ? "点击地面生成物体 · " : ""}
              拖拽旋转 · 滚轮缩放 · ← → 换场景 · 空格暂停 · R 重置
            </p>
          </div>

          <aside className="phys-dock" aria-live="polite">
            <p className="phys-kicker">
              {scene.emoji} 场景 {SCENES.findIndex((s) => s.id === sceneId) + 1}/{SCENES.length}
            </p>
            <h2 className="text-balance">{scene.title}</h2>
            <p className="tagline text-pretty">{scene.tagline}</p>
            <p className="blurb text-pretty">{scene.blurb}</p>

            <div className="phys-params">
              {paramList.map((p) => (
                <label key={p.key} className="phys-param">
                  <span>
                    {p.label}
                    <b className="tabular">{fmt(params[p.key] ?? p.default)}</b>
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

            <ul className="phys-list">
              <li>拖拽旋转视角，滚轮缩放；沙盒场景可点击地面生成物体。</li>
              <li>水面场景会给浸入物体加浮力，波面会轻微起伏。</li>
              <li>手机上也可转视角；球太多时会更吃性能。</li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}

function fmt(v: number) {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}
