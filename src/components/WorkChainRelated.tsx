import Link from "next/link";
import {
  HYDRO_CHAIN_STEPS,
  HYDRO_ML_TITLE,
  getChainNeighbors,
  getHydroChainMeta,
  getHydroLane,
  type HydroChainStep,
} from "@/lib/hydro-guide";

type MiniWork = {
  id: string;
  title: string;
  description: string | null;
};

type Props = {
  currentTitle: string;
  /** 按标题查到的已发布作品（含主链与 ML） */
  byTitle: Map<string, MiniWork>;
};

function Card({
  work,
  meta,
  kind,
}: {
  work: MiniWork;
  meta?: HydroChainStep | null;
  kind: "上游" | "下游" | "对照";
}) {
  const lane = meta?.lane || getHydroLane(work.title);
  return (
    <Link
      href={`/works/${work.id}`}
      className="block rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors p-4"
    >
      <div className="flex flex-wrap gap-2 mb-2 text-[11px]">
        <span className="px-2 py-0.5 rounded-full bg-[#2ec4b6]/90 text-[#041018] font-semibold">
          {kind}
        </span>
        {meta?.badge && (
          <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/85">
            链路 {meta.badge}
          </span>
        )}
        {lane && (
          <span className="px-2 py-0.5 rounded-full bg-[#e44c65]/85 text-white">{lane}</span>
        )}
      </div>
      <p className="font-medium text-white/95 leading-snug">{work.title}</p>
      {work.description && (
        <p className="text-sm text-white/55 mt-1.5 line-clamp-2">{work.description}</p>
      )}
    </Link>
  );
}

/** 作品详情底部：主链上下游，而非随机相关 */
export function WorkChainRelated({ currentTitle, byTitle }: Props) {
  const neighbors = getChainNeighbors(currentTitle);
  const current = getHydroChainMeta(currentTitle);
  const items: {
    kind: "上游" | "下游" | "对照";
    title: string;
    meta?: HydroChainStep | null;
  }[] = [];

  if (neighbors.upstream) {
    items.push({ kind: "上游", title: neighbors.upstream.title, meta: neighbors.upstream });
  }
  if (neighbors.downstream) {
    items.push({ kind: "下游", title: neighbors.downstream.title, meta: neighbors.downstream });
  }
  if (neighbors.mlSide) {
    items.push({ kind: "对照", title: HYDRO_ML_TITLE, meta: null });
  }
  if (currentTitle === HYDRO_ML_TITLE) {
    const model = getHydroChainMeta("新安江机理预报对照台");
    if (model) items.push({ kind: "对照", title: model.title, meta: model });
  }

  // 非主链：推荐主链首 / 中 / 尾三步
  if (!current && currentTitle !== HYDRO_ML_TITLE) {
    for (const s of [HYDRO_CHAIN_STEPS[0], HYDRO_CHAIN_STEPS[2], HYDRO_CHAIN_STEPS[4]]) {
      items.push({
        kind: s.step === 1 ? "上游" : s.step === 5 ? "下游" : "对照",
        title: s.title,
        meta: s,
      });
    }
  }

  const seen = new Set<string>();
  const resolved = items
    .map((it) => {
      if (seen.has(it.title)) return null;
      seen.add(it.title);
      const work = byTitle.get(it.title);
      if (!work) return null;
      return { ...it, work };
    })
    .filter(Boolean) as Array<{
    kind: "上游" | "下游" | "对照";
    title: string;
    meta?: HydroChainStep | null;
    work: MiniWork;
  }>;

  if (resolved.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-white/15" aria-label="主链上下游">
      <h2 className="font-display text-xl md:text-2xl font-bold mb-2 text-shadow">主链上下游</h2>
      <p className="text-sm text-white/55 mb-5">
        按「采集 → 空间 → 态势 → 预报 → 文档」推荐相邻环节，便于面试顺着讲。
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {resolved.map((it) => (
          <Card key={`${it.kind}-${it.work.id}`} work={it.work} meta={it.meta} kind={it.kind} />
        ))}
      </div>
      <p className="mt-4 text-sm">
        <Link href="/hydrobench" className="text-[#7bdff2] hover:text-white transition-colors">
          打开智慧水利总览 →
        </Link>
      </p>
    </section>
  );
}
