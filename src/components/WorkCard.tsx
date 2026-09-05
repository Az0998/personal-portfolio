"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github, ExternalLink, Presentation } from "lucide-react";
import Link from "next/link";
import { parseTags, getWorkCategoryLabel, resolveWorkCategory } from "@/lib/utils";
import { getShowcaseByTitle } from "@/data/showcases";
import { presentationHrefForTitle } from "@/data/presentations";
import { workCovers, moodCovers } from "@/data/covers";
import { getHydroChainMeta, getHydroLane, isFeaturedWorkTitle } from "@/lib/hydro-guide";

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

function isPresentationLink(href: string) {
  return href.startsWith("/presentations/");
}

export function WorkCard({ work, index = 0, large = false }: WorkCardProps) {
  const tags = parseTags(work.tags);
  const showcase = getShowcaseByTitle(work.title);
  const cat = resolveWorkCategory(work.title, work.category);
  const mood = showcase?.mood ?? (cat === "hydro" ? "hydro" : cat === "paper" ? "paper" : "tool");
  const deckHref = presentationHrefForTitle(work.title);
  const demoHref = work.link && !isPresentationLink(work.link) ? work.link : null;
  const openHref = demoHref || work.link || deckHref;
  const cover = resolveCover(work, mood);
  const hasLiveDemo = Boolean(demoHref);
  const isFeatured = work.featured || isFeaturedWorkTitle(work.title);
  const chainMeta = getHydroChainMeta(work.title);
  const isHydroChain = Boolean(chainMeta);
  const hydroLane = getHydroLane(work.title);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.04, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.985 }}
      className={`group anime-card flex flex-col relative overflow-hidden ${large ? "md:col-span-2" : ""}`}
    >
      {isHydroChain && (
        <span
          className="absolute left-0 top-0 bottom-0 w-1 z-10 bg-[var(--hydro-chain,#2ec4b6)] shadow-[0_0_12px_rgba(46,196,182,0.45)]"
          title="智慧水利主链"
          aria-hidden
        />
      )}
      <Link href={`/works/${work.id}`} className="block flex-1">
        <div className={`relative overflow-hidden ${large ? "h-56 md:h-64" : "h-40 md:h-44"}`}>
          {isSvg(cover) ? (
            <div className="w-full h-full bg-gradient-to-br from-[#e44c65]/35 via-white/10 to-[#5ec8e8]/25 flex items-center justify-center p-6">
              <img
                src={cover}
                alt=""
                className="max-h-full max-w-[75%] object-contain drop-shadow-md transition-transform duration-150 ease-out group-hover:scale-105"
              />
            </div>
          ) : (
            <img
              src={cover}
              alt={work.title}
              className="w-full h-full object-cover transition-transform duration-150 ease-out group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[75%]">
            <span className="px-2.5 py-1 text-[11px] font-medium bg-[#e44c65]/92 text-white rounded-full">
              {getWorkCategoryLabel(work.title, work.category)}
            </span>
            {chainMeta && (
              <span
                className="px-2.5 py-1 text-[11px] bg-[#2ec4b6]/95 text-[#041018] rounded-full font-bold tabular-nums"
                title={`智慧水利主链 ${chainMeta.badge}`}
              >
                链路 {chainMeta.badge}
              </span>
            )}
            {hydroLane && (
              <span className="px-2.5 py-1 text-[11px] bg-black/50 backdrop-blur-sm text-[#7bdff2] rounded-full border border-[#2ec4b6]/35">
                {hydroLane}
              </span>
            )}
            {isFeatured && !isHydroChain && (
              <span className="px-2.5 py-1 text-[11px] bg-[#5ec8e8]/92 text-[#1a1218] rounded-full font-medium">
                精选
              </span>
            )}
          </div>
          {(hasLiveDemo || deckHref) && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-[11px] bg-black/45 backdrop-blur-sm text-white/90 rounded-full border border-white/15">
              {hasLiveDemo ? "可体验" : "汇报"}
            </span>
          )}
          {showcase?.tagline && (
            <p className="absolute bottom-3 left-3 right-3 text-xs md:text-sm text-white/90 line-clamp-2 text-shadow">
              {showcase.tagline}
            </p>
          )}
        </div>

        <div className="p-4 md:p-5">
          <h3 className="text-base md:text-lg font-semibold mb-1.5 group-hover:text-[#ff9aab] transition-colors duration-150 flex items-start gap-2 leading-snug text-balance">
            <span className="flex-1">{work.title}</span>
            <ArrowUpRight className="w-4 h-4 shrink-0 mt-0.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-[opacity,transform] duration-150" />
          </h3>
          {work.description && (
            <p className="text-white/60 text-sm line-clamp-2 mb-3 leading-relaxed text-pretty">
              {work.description}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-[11px] text-white/65 bg-white/10 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {(openHref || work.github || deckHref) && (
        <div className="px-4 md:px-5 pb-4 flex flex-wrap gap-2 -mt-1">
          {openHref && (
            <a
              href={openHref}
              target={openHref.startsWith("http") ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#e44c65]/85 hover:bg-[#e44c65] text-white transition-colors"
            >
              {isPresentationLink(openHref) ? (
                <Presentation className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              {isPresentationLink(openHref) ? "汇报" : "打开"}
            </a>
          )}
          {deckHref && demoHref && (
            <a
              href={deckHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/85 transition-colors"
            >
              <Presentation className="w-3.5 h-3.5" />
              介绍
            </a>
          )}
          {work.github && (
            <a
              href={work.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/85 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              源码
            </a>
          )}
        </div>
      )}
    </motion.article>
  );
}
