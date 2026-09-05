"use client";

import { useEffect, useRef, useState } from "react";
import { hydroInfoHref } from "@/lib/hydro-station-map";

export type StationSeriesPayload = {
  station_id: string;
  name: string;
  schematic?: boolean;
  unit_q?: string;
  unit_stage?: string;
  warn_stage?: number;
  alert_stage?: number;
  points: { t: string; q: number; stage: number }[];
  note?: string;
};

type Props = {
  open: boolean;
  basinId: string;
  stationId: string | null;
  stationName?: string;
  hydroHubUrl: string;
  onClose: () => void;
};

function drawSeries(
  canvas: HTMLCanvasElement,
  values: number[],
  color: string,
  warn?: number,
  alert?: number
) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.max(1, Math.floor(w * dpr));
  canvas.height = Math.max(1, Math.floor(h * dpr));
  const ctx = canvas.getContext("2d");
  if (!ctx || values.length < 2) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const pad = 8;
  const min = Math.min(...values, warn ?? Infinity, alert ?? Infinity);
  const max = Math.max(...values, warn ?? -Infinity, alert ?? -Infinity);
  const span = max - min || 1;
  const yAt = (v: number) => pad + ((max - v) / span) * (h - pad * 2);
  const xAt = (i: number) => pad + (i / (values.length - 1)) * (w - pad * 2);

  const drawThresh = (v: number | undefined, stroke: string) => {
    if (v == null || !Number.isFinite(v)) return;
    const y = yAt(v);
    ctx.strokeStyle = stroke;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  drawThresh(warn, "rgba(255, 183, 77, 0.85)");
  drawThresh(alert, "rgba(231, 76, 60, 0.85)");

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  values.forEach((v, i) => {
    const x = xAt(i);
    const y = yAt(v);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

export function StationSeriesDrawer({
  open,
  basinId,
  stationId,
  stationName,
  hydroHubUrl,
  onClose,
}: Props) {
  const [data, setData] = useState<StationSeriesPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const qRef = useRef<HTMLCanvasElement>(null);
  const sRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !stationId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const res = await fetch(
          `/watershed-map/basins/${basinId}/series/${stationId}.json`
        );
        if (!res.ok) throw new Error("过程线文件未找到（仍可跳转 HydroInfo 示意站）");
        const json = (await res.json()) as StationSeriesPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, basinId, stationId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!data || !open) return;
    const q = data.points.map((p) => p.q);
    const s = data.points.map((p) => p.stage);
    if (qRef.current) drawSeries(qRef.current, q, "#4cc9f0");
    if (sRef.current) {
      drawSeries(
        sRef.current,
        s,
        "#2ec4b6",
        data.warn_stage,
        data.alert_stage
      );
    }
  }, [data, open]);

  if (!open) return null;

  const csvHref = stationId
    ? `/watershed-map/basins/${basinId}/series/${stationId}.csv`
    : "#";
  const hubHref = hydroInfoHref(stationId, hydroHubUrl);

  return (
    <div className="wm-drawer-root" role="dialog" aria-modal="true" aria-label="站点过程线">
      <button type="button" className="wm-drawer-backdrop" aria-label="关闭" onClick={onClose} />
      <aside className="wm-drawer">
        <div className="wm-drawer-head">
          <div>
            <div className="wm-kicker">示意过程线 · schematic</div>
            <h3>{data?.name || stationName || stationId}</h3>
            <p className="wm-muted">站码 {stationId}</p>
          </div>
          <button type="button" className="wm-clear" onClick={onClose}>
            关闭
          </button>
        </div>

        {loading && <p className="wm-muted">加载 CSV/JSON 序列…</p>}
        {error && <p className="wm-error">{error}</p>}

        {data && (
          <>
            <div className="wm-chart-block">
              <div className="wm-chart-label">水位 {data.unit_stage || "m"}（虚线=警戒/保证）</div>
              <canvas ref={sRef} className="wm-chart" />
            </div>
            <div className="wm-chart-block">
              <div className="wm-chart-label">流量 {data.unit_q || "m³/s"}</div>
              <canvas ref={qRef} className="wm-chart" />
            </div>
            <p className="wm-hint">{data.note || "示意序列，不可用于报汛。"}</p>
          </>
        )}

        <div className="wm-drawer-actions">
          {data && (
            <a className="wm-pill" href={csvHref} download>
              下载 CSV
            </a>
          )}
          <a className="wm-pill" href={hubHref}>
            打开 HydroInfo 示意过程线
          </a>
        </div>
      </aside>
    </div>
  );
}
