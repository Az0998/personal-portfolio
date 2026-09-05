import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Github, Presentation } from "lucide-react";
import { parseTags, getWorkCategoryLabel } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getShowcaseByTitle } from "@/data/showcases";
import { presentationHrefForTitle } from "@/data/presentations";
import { ShowcasePanel } from "@/components/ShowcasePanel";
import { SiteBackground } from "@/components/SiteBackground";
import { workCovers, moodCovers } from "@/data/covers";
import { WorkChainRelated } from "@/components/WorkChainRelated";
import {
  FEATURED_WORK_TITLES,
  HYDRO_CHAIN_STEPS,
  HYDRO_ML_TITLE,
  getHydroChainMeta,
  getHydroLane,
} from "@/lib/hydro-guide";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function WorkDetailPage({ params }: PageProps) {
  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });

  if (!work || !work.published) notFound();

  const tags = parseTags(work.tags);
  const showcase = getShowcaseByTitle(work.title);
  const deckHref = presentationHrefForTitle(work.title);
  const demoHref =
    work.link && !work.link.startsWith("/presentations/") ? work.link : null;
  const primaryHref = demoHref || work.link || deckHref;
  const mood = showcase?.mood ?? "tool";
  const cover =
    work.coverImage ||
    workCovers[work.title] ||
    moodCovers[mood] ||
    "/media/covers/picsum-29.jpg";
  const svg = cover.endsWith(".svg");
  const chainMeta = getHydroChainMeta(work.title);
  const hydroLane = getHydroLane(work.title);

  const relatedTitles = Array.from(
    new Set([
      ...HYDRO_CHAIN_STEPS.map((s) => s.title),
      HYDRO_ML_TITLE,
      ...FEATURED_WORK_TITLES,
    ])
  );
  const relatedRows = await prisma.work.findMany({
    where: { published: true, title: { in: relatedTitles } },
    select: { id: true, title: true, description: true },
  });
  const byTitle = new Map(relatedRows.map((w) => [w.title, w]));

  return (
    <div className="min-h-dvh relative">
      <SiteBackground />
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/#works" className="nav-pill text-white/85" aria-label="返回作品列表">
            <ArrowLeft className="w-4 h-4" />
            返回作品
          </Link>
        </div>
      </nav>

      <main className="relative z-[1] pt-24 pb-20 px-6">
        <article className="max-w-4xl mx-auto glass-panel rounded-[2rem] p-6 md:p-10">
          <div className="rounded-2xl overflow-hidden mb-8 aspect-video border border-white/15 bg-black/20">
            {svg ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#e44c65]/30 to-[#5ec8e8]/20 p-8">
                <img src={cover} alt="" className="max-h-full object-contain" />
              </div>
            ) : (
              <img src={cover} alt={work.title} className="w-full h-full object-cover" />
            )}
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-[#e44c65]/90 text-white rounded-full">
              {getWorkCategoryLabel(work.title, work.category)}
            </span>
            {chainMeta && (
              <span className="px-3 py-1 text-xs bg-[#2ec4b6]/95 text-[#041018] rounded-full font-bold tabular-nums">
                链路 {chainMeta.badge}
              </span>
            )}
            {hydroLane && (
              <span className="px-3 py-1 text-xs bg-white/10 text-[#7bdff2] rounded-full border border-[#2ec4b6]/30">
                {hydroLane}
              </span>
            )}
            {work.featured && (
              <span className="px-3 py-1 text-xs bg-[#5ec8e8]/90 text-[#1a1218] rounded-full font-medium">
                Featured
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-shadow">
            {work.title}
          </h1>

          {work.description && (
            <p className="text-xl text-white/75 mb-6">{work.description}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm text-white/70 bg-white/10 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-12">
            {primaryHref && (
              <a
                href={primaryHref}
                {...(primaryHref.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="btn-primary"
              >
                {primaryHref.startsWith("/presentations/") ? (
                  <Presentation className="w-4 h-4" />
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {primaryHref.startsWith("/presentations/")
                  ? "打开汇报"
                  : primaryHref.startsWith("/")
                    ? "打开演示"
                    : "查看项目"}
              </a>
            )}
            {deckHref && demoHref && (
              <a href={deckHref} className="btn-outline">
                <Presentation className="w-4 h-4" />
                项目介绍
              </a>
            )}
            {work.github && (
              <a href={work.github} target="_blank" rel="noopener noreferrer" className="btn-outline">
                <Github className="w-4 h-4" />
                源代码
              </a>
            )}
          </div>

          {showcase && <ShowcasePanel showcase={showcase} />}

          {work.content && (
            <div className="prose-anime">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{work.content}</ReactMarkdown>
            </div>
          )}

          <WorkChainRelated currentTitle={work.title} byTitle={byTitle} />
        </article>
      </main>
    </div>
  );
}
