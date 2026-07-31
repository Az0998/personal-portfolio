"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, ExternalLink } from "lucide-react";
import Link from "next/link";
import { parseTags, getCategoryLabel } from "@/lib/utils";
import { getShowcaseByTitle } from "@/data/showcases";
import { workCovers, moodCovers } from "@/data/covers";

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

function resolveCover(work: WorkItem, mood: string) {
  if (work.coverImage) return work.coverImage;
  if (workCovers[work.title]) return workCovers[work.title];
  return moodCovers[mood] || "/media/covers/picsum-29.jpg";
}

function isSvg(src: string) {
  return src.endsWith(".svg");
}

export function WorkCard({ work, index = 0, large = false }: WorkCardProps) {
  const tags = parseTags(work.tags);
  const showcase = getShowcaseByTitle(work.title);
  const mood = showcase?.mood ?? "tool";
  const effectiveLink = work.link || (showcase ? `/${showcase.slug}` : null);
  const cover = resolveCover(work, mood);

  return (
    <motion.article
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.22 } }}
      whileTap={{ scale: 0.985 }}
      className={`group anime-card ${large ? "md:col-span-2" : ""}`}
    >
      <Link href={`/works/${work.id}`} className="block">
        <div className={`relative overflow-hidden ${large ? "h-64 md:h-72" : "h-44"}`}>
          {isSvg(cover) ? (
            <div className="w-full h-full bg-gradient-to-br from-[#e44c65]/35 via-white/10 to-[#5ec8e8]/25 flex items-center justify-center p-6">
              <img
                src={cover}
                alt=""
                className="max-h-full max-w-[80%] object-contain drop-shadow-md transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          ) : (
            <img
              src={cover}
              alt={work.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-3 py-1 text-xs font-medium bg-[#e44c65]/90 text-white rounded-full">
              {getCategoryLabel(work.category)}
            </span>
            {work.featured && (
              <span className="px-3 py-1 text-xs bg-[#5ec8e8]/90 text-[#1a1218] rounded-full font-medium">
                Featured
              </span>
            )}
          </div>
          {showcase?.tagline && (
            <p className="absolute bottom-3 left-3 right-3 text-sm text-white/85 line-clamp-2 text-shadow">
              {showcase.tagline}
            </p>
          )}
        </div>

        <div className="p-5 md:p-6">
          <h3 className="text-lg md:text-xl font-semibold mb-2 group-hover:text-[#ff9aab] transition-colors flex items-center gap-2">
            {work.title}
            <ArrowUpRight className="w-4 h-4 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
          </h3>
          {work.description && (
            <p className="text-white/65 text-sm line-clamp-2 mb-3">{work.description}</p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs text-white/70 bg-white/10 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {(effectiveLink || work.github) && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {work.github && (
            <a
              href={work.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-[#e44c65] transition-colors"
            >
              <Github className="w-4 h-4" />
            </a>
          )}
          {effectiveLink && (
            <a
              href={effectiveLink}
              target={effectiveLink.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-black/50 backdrop-blur-sm rounded-full hover:bg-[#5ec8e8] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </motion.article>
  );
}
