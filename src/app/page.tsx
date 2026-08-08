import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
import { SakuraPetals } from "@/components/AnimeDecor";
import {
  Hero,
  About,
  Contact,
  Sponsor,
  FeedbackForm,
  AnalyticsBeacon,
} from "@/components/Hero";
import { WorksSection } from "@/components/WorksSection";

export const dynamic = "force-dynamic";

const defaultProfile = {
  name: "张森捷",
  title: "智慧水利 · 水信息 · 机器学习",
  tagline: "把站网态势、质控预警与径流预报做成可点开的产品。",
  bio: null as string | null,
  avatar: null as string | null,
  email: null as string | null,
  phone: null as string | null,
  location: null as string | null,
  github: "https://github.com/Az0998" as string | null,
  linkedin: null as string | null,
  twitter: null as string | null,
  website: null as string | null,
  wechat: null as string | null,
  sponsorUrl: null as string | null,
  sponsorQr: null as string | null,
  sponsorNote: null as string | null,
};

function HomeChrome({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteBackground />
      <AnalyticsBeacon />
      <div className="relative z-[1] min-h-dvh flex flex-col">
        <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden" aria-hidden>
          <SakuraPetals />
        </div>
        <Navbar name={name} />
        <main className="flex-1 relative z-[2]">{children}</main>
        <Footer name={name} />
      </div>
    </>
  );
}

function WorksSkeleton() {
  return (
    <section id="works" className="px-6 py-20 max-w-6xl mx-auto w-full">
      <div className="h-8 w-40 rounded-full bg-white/10 mb-8 animate-pulse" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="anime-card h-64 animate-pulse bg-white/5" />
        ))}
      </div>
    </section>
  );
}

async function HomeBody() {
  const [profile, works] = await Promise.all([
    prisma.profile.findFirst(),
    prisma.work.findMany({
      where: { published: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const p = profile ?? defaultProfile;

  return (
    <HomeChrome name={p.name}>
      <Hero profile={p} />
      <About profile={p} />
      <WorksSection works={works} />
      <Sponsor profile={p} />
      <FeedbackForm />
      <Contact profile={p} />
    </HomeChrome>
  );
}

function HomeFallback() {
  return (
    <HomeChrome name={defaultProfile.name}>
      <section className="px-6 pt-28 pb-16 max-w-4xl mx-auto">
        <p className="font-display text-4xl md:text-5xl text-shadow mb-3">{defaultProfile.name}</p>
        <p className="text-white/70 text-lg mb-2">{defaultProfile.title}</p>
        <p className="text-white/50 text-sm">{defaultProfile.tagline}</p>
      </section>
      <WorksSkeleton />
    </HomeChrome>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeBody />
    </Suspense>
  );
}
