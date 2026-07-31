import { prisma } from "@/lib/db";
import { Navbar, Footer } from "@/components/Navbar";
import { SiteBackground } from "@/components/SiteBackground";
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

export default async function HomePage() {
  const profile = await prisma.profile.findFirst();
  const works = await prisma.work.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const defaultProfile = {
    name: "Portfolio",
    title: "个人作品集",
    tagline: null,
    bio: null,
    avatar: null,
    email: null,
    phone: null,
    location: null,
    github: null,
    linkedin: null,
    twitter: null,
    website: null,
    wechat: null,
    sponsorUrl: null,
    sponsorQr: null,
    sponsorNote: null,
  };

  const p = profile ?? defaultProfile;

  return (
    <>
      <SiteBackground />
      <AnalyticsBeacon />
      <div className="relative z-[1] min-h-screen flex flex-col">
        <Navbar name={p.name} />
        <main className="flex-1">
          <Hero profile={p} />
          <About profile={p} />
          <WorksSection works={works} />
          <Sponsor profile={p} />
          <FeedbackForm />
          <Contact profile={p} />
        </main>
        <Footer name={p.name} />
      </div>
    </>
  );
}
