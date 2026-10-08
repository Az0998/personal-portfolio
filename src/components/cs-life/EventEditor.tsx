"use client";

import { useState } from "react";
import type { CustomEventDef, StatDelta } from "@/lib/cs-life/types";

type Props = {
  onInsert: (def: CustomEventDef) => void;
  onSaveLibrary: (def: CustomEventDef) => void;
};

const EFFECT_KEYS = [
  "aim",
  "utility",
  "sense",
  "mentality",
  "attitude",
  "leadership",
  "appearance",
  "loyalty",
  "fame",
  "form",
  "clutch",
] as const;

type Row = {
  id: string;
  label: string;
  weight: number;
  effectKey: string;
  effectVal: number;
  enqueue: string;
};

export function EventEditor({ onInsert, onSaveLibrary }: Props) {
  const [title, setTitle] = useState("自定义世界线");
  const [blurb, setBlurb] = useState("");
  const [rows, setRows] = useState<Row[]>([
    { id: "a", label: "是", weight: 40, effectKey: "mentality", effectVal: 2, enqueue: "" },
    { id: "b", label: "否", weight: 60, effectKey: "mentality", effectVal: -1, enqueue: "" },
  ]);

  const build = (): CustomEventDef => ({
    id: `custom_${Date.now().toString(36)}`,
    title: title.trim() || "未命名事件",
    blurb: blurb.trim() || undefined,
    createdAt: new Date().toISOString(),
    options: rows.map((r) => {
      const effects: StatDelta = {};
      if (r.effectKey && r.effectVal) {
        effects[r.effectKey as keyof StatDelta] = r.effectVal;
      }
      return {
        id: r.id || r.label,
        label: r.label,
        weight: Math.max(1, Number(r.weight) || 1),
        effects: Object.keys(effects).length ? effects : undefined,
        enqueue: r.enqueue
          ? r.enqueue
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
      };
    }),
  });

  return (
    <section className="csl-editor" aria-label="自定义事件">
      <h2>自定义事件插入</h2>
      <p className="csl-meta">
        选项与占比自定义；效果写到多维/判定维；enqueue 填模板 id（如 major_chain, girlfriend,
        transfer）可接后续分支。
      </p>
      <label className="csl-field">
        标题
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="csl-field">
        说明
        <input value={blurb} onChange={(e) => setBlurb(e.target.value)} placeholder="可选" />
      </label>
      <div className="csl-rows">
        {rows.map((r, i) => (
          <div key={i} className="csl-row">
            <input
              placeholder="标签"
              value={r.label}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, label: e.target.value, id: e.target.value || r.id };
                setRows(next);
              }}
            />
            <input
              type="number"
              title="占比权重"
              value={r.weight}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, weight: Number(e.target.value) };
                setRows(next);
              }}
            />
            <select
              value={r.effectKey}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, effectKey: e.target.value };
                setRows(next);
              }}
            >
              {EFFECT_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            <input
              type="number"
              title="效果加减"
              value={r.effectVal}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, effectVal: Number(e.target.value) };
                setRows(next);
              }}
            />
            <input
              placeholder="enqueue id"
              value={r.enqueue}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, enqueue: e.target.value };
                setRows(next);
              }}
            />
            <button
              type="button"
              className="csl-btn"
              onClick={() => setRows(rows.filter((_, j) => j !== i))}
              disabled={rows.length <= 1}
            >
              删
            </button>
          </div>
        ))}
      </div>
      <div className="csl-actions">
        <button
          type="button"
          className="csl-btn"
          onClick={() =>
            setRows([
              ...rows,
              {
                id: `o${rows.length}`,
                label: "新选项",
                weight: 10,
                effectKey: "form",
                effectVal: 0,
                enqueue: "",
              },
            ])
          }
        >
          加选项
        </button>
        <button
          type="button"
          className="csl-btn primary"
          onClick={() => {
            const def = build();
            onSaveLibrary(def);
            onInsert(def);
          }}
        >
          插入并立即转入
        </button>
      </div>
      <p className="csl-note">
        常用模板 id：worldline_shiro · transfer · champ_count · major_chain · girlfriend ·
        reinforce_count · map_bp · half_score
      </p>
    </section>
  );
}
