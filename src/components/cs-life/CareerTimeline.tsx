"use client";

import type { CareerEvent } from "@/lib/cs-life/types";

const KIND_LABEL: Record<CareerEvent["kind"], string> = {
  team: "战队",
  rank: "排名",
  major: "Major",
  finals: "决赛",
  form: "状态",
  life: "生活",
  match: "对局",
  custom: "自定义",
  worldline: "世界线",
};

type Props = {
  events: CareerEvent[];
  /** 只看某一年；不传则全部 */
  year?: number;
  title?: string;
  compact?: boolean;
};

export function CareerTimeline({ events, year, title, compact }: Props) {
  const list = year != null ? events.filter((e) => e.year === year) : events;
  const grouped = new Map<number, CareerEvent[]>();
  for (const e of list) {
    if (!grouped.has(e.year)) grouped.set(e.year, []);
    grouped.get(e.year)!.push(e);
  }
  const years = [...grouped.keys()].sort((a, b) => a - b);

  if (!years.length) {
    return (
      <section className={`csl-tl ${compact ? "compact" : ""}`}>
        {title && <h3 className="csl-tl-title">{title}</h3>}
        <p className="csl-tl-empty">这一阶段还没有记上事件。</p>
      </section>
    );
  }

  return (
    <section className={`csl-tl ${compact ? "compact" : ""}`} aria-label={title || "生涯时间线"}>
      {title && <h3 className="csl-tl-title">{title}</h3>}
      <ol className="csl-tl-years">
        {years.map((y) => (
          <li key={y} className="csl-tl-year">
            <div className="csl-tl-year-mark">
              <span className="csl-tl-dot" aria-hidden />
              <strong>{y}</strong>
            </div>
            <ul className="csl-tl-events">
              {grouped.get(y)!.map((e, i) => (
                <li key={`${y}-${i}`} className={`csl-tl-ev kind-${e.kind}`}>
                  <span className="csl-tl-badge">{KIND_LABEL[e.kind] || e.kind}</span>
                  <div>
                    <p className="csl-tl-ev-title">{e.title}</p>
                    <p className="csl-tl-ev-detail">{e.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
