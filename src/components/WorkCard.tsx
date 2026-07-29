"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, ExternalLink } from "lucide-react";
import Link from "next/link";
import { parseTags, getCategoryLabel } from "@/lib/utils";
import { getShowcaseByTitle } from "@/data/showcases";

export interface WorkItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string | null;
  coverImage: string | null;
  link: string | null;
  github: string | null;
  featured: boolean;
}

interface WorkCardProps {
  work: WorkItem;
  index?: number;
  large?: boolean;
}

const moodCover: Record<string, string> = {
  hydro: "from-aqua/40 via-night-mist to-night",
  pet: "from-sakura/50 via-night-mist to-night",
  tool: "from-aqua-soft/40 via-sakura/20 to-night",
  plant: "from-emerald-400/40 via-lime-300/10 to-night",
  field: "from-amber-400/30 via-orange-300/10 to-night",
  novel: "from-fuchsia-400/30 via-sakura/20 to-night",
  paper: "from-sky-400/30 via-indigo-300/10 to-night",
};

export function WorkCard({ work, index = 0, large = false }: WorkCardProps) {
  const tags = parseTags(work.tags);
  const showcase = getShowcaseByTitle(work.title);
  const mood = showcase?.mood ?? "tool";
  // 如果 curated works 的 link 字段还没被 seed 进数据库，用 showcases 的 slug 兜底
  const effectiveLink = work.link || (showcase ? `/${showcase.slug}` : null);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className={`group anime-card ${large ? "md:col-span-2" : ""}`}
    >
      <Link href={`/works/${work.id}`} className="block">
        <div className={`relative overflow-hidden ${large ? "h-72" : "h-48"}`}>
          {work.coverImage ? (
            <img
              src={work.coverImage}
              alt={work.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${moodCover[mood]} flex items-center justify-center`}
            >
              <span className="text-6xl animate-float">{showcase?.heroEmoji ?? work.title.charAt(0)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/30 to-transparent" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-sakura/80 text-white rounded-full">
              {getCategoryLabel(work.category)}
            </span>
            {work.featured && (
              <span className="px-3 py-1 text-xs font-cute bg-aqua/80 text-night rounded-full">
                Featured
              </span>
            )}
          </div>
          {showcase?.tagline && (
            <p className="absolute bottom-4 left-4 right-4 text-sm text-white/80 line-clamp-2">
              {showcase.tagline}
            </p>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-sakura-soft transition-colors flex items-center gap-2">
            {work.title}
            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
          </h3>
          {work.description && (
            <p className="text-ink-400 text-sm line-clamp-2 mb-4">{work.description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs text-ink-300 bg-white/5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {(effectiveLink || work.github) && (
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {work.github && (
            <a
              href={work.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-night/80 rounded-full hover:bg-sakura transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {effectiveLink && (
            <a
              href={effectiveLink}
              {...(effectiveLink.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-night/80 rounded-full hover:bg-aqua transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </motion.article>
  );
}
