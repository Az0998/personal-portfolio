import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { parseTags, getCategoryLabel } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getShowcaseByTitle } from "@/data/showcases";
import { ShowcasePanel } from "@/components/ShowcasePanel";
import { StarField } from "@/components/AnimeDecor";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function WorkDetailPage({ params }: PageProps) {
  const { id } = await params;
  const work = await prisma.work.findUnique({ where: { id } });

  if (!work || !work.published) notFound();

  const tags = parseTags(work.tags);
  const showcase = getShowcaseByTitle(work.title);
  // 数据库可能还没 seed 最新的 link，用 showcase slug 兜底
  const effectiveLink = work.link || (showcase ? `/${showcase.slug}` : null);

  return (
    <div className="min-h-screen relative">
      <StarField />
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-sakura/10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link
            href="/#works"
            className="flex items-center gap-2 text-ink-300 hover:text-sakura-soft transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回作品世界
          </Link>
        </div>
      </nav>

      <main className="relative pt-24 pb-20 px-6">
        <article className="max-w-4xl mx-auto">
          {work.coverImage ? (
            <div className="rounded-3xl overflow-hidden mb-8 aspect-video border border-sakura/20">
              <img
                src={work.coverImage}
                alt={work.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="rounded-3xl overflow-hidden mb-8 aspect-[21/9] border border-sakura/20 bg-gradient-to-br from-sakura/20 via-night-mist to-aqua/20 flex items-center justify-center">
              <span className="text-7xl">{showcase?.heroEmoji ?? "✦"}</span>
            </div>
          )}

          <div className="mb-6 flex flex-wrap gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-sakura/80 text-white rounded-full">
              {getCategoryLabel(work.category)}
            </span>
            {work.featured && (
              <span className="px-3 py-1 text-xs font-cute bg-aqua/80 text-night rounded-full">
                Featured
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {work.title}
          </h1>

          {work.description && (
            <p className="text-xl text-ink-300 mb-6">{work.description}</p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-sm text-ink-300 bg-white/5 rounded-lg border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-4 mb-12">
            {effectiveLink && (
              <a
                href={effectiveLink}
                {...(effectiveLink.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="btn-primary"
              >
                <ExternalLink className="w-4 h-4" />
                {effectiveLink.startsWith("/") ? "打开演示" : "查看项目"}
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
        </article>
      </main>
    </div>
  );
}
