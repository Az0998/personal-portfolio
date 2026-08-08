import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  allPresentationSlugs,
  getPresentation,
} from "@/data/presentations";
import { PresentationDeck } from "@/components/presentations/PresentationDeck";
import "../presentations.css";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allPresentationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const deck = getPresentation(slug);
  if (!deck) return { title: "项目汇报" };
  return {
    title: `${deck.title} · 项目汇报`,
    description: deck.tagline,
  };
}

export default async function PresentationPage({ params }: PageProps) {
  const { slug } = await params;
  const deck = getPresentation(slug);
  if (!deck) notFound();

  return <PresentationDeck deck={deck} />;
}
