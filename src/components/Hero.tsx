"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import {
  trackClick,
  trackCta,
  trackPageview,
  observeAttention,
} from "@/lib/analytics";

export interface ProfileView {
  name: string;
  title: string;
  tagline?: string | null;
  bio?: string | null;
  avatar?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  github?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  website?: string | null;
  wechat?: string | null;
  sponsorUrl?: string | null;
  sponsorQr?: string | null;
  sponsorNote?: string | null;
}

interface HeroProps {
  profile: ProfileView;
}

export function AnalyticsBeacon() {
  useEffect(() => {
    trackPageview();
  }, []);
  return null;
}

/** 打字机一行（对齐 dayabolg Typewriter） */
function TypeLine({ text }: { text: string }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, 70);
    return () => clearInterval(t);
  }, [text]);
  return (
    <span className="inline-block min-h-[1.5em]">
      {shown}
      <span className="inline-block w-[0.55ch] h-[1em] ml-0.5 align-[-0.1em] bg-[#e44c65] animate-pulse" />
    </span>
  );
}

export function Hero({ profile }: HeroProps) {
  const socialLinks = [
    { icon: "mdi:github", href: profile.github, label: "GitHub", target: "social-github" },
    { icon: "mdi:linkedin", href: profile.linkedin, label: "LinkedIn", target: "social-linkedin" },
    { icon: "mdi:twitter", href: profile.twitter, label: "Twitter", target: "social-twitter" },
    { icon: "mdi:web", href: profile.website, label: "Website", target: "social-website" },
  ].filter((l) => l.href);

  return (
    <section className="relative z-[1] min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl flex flex-col-reverse sm:flex-row gap-10 sm:gap-14 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col text-center sm:text-left justify-center gap-4 text-white text-shadow
                     transform transition-transform duration-500 hover:scale-[1.03]"
        >
          <p className="text-[#ff9aab] text-sm tracking-[0.2em] uppercase">
            二次元 × 智慧水利
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight">
            {profile.name}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            <TypeLine text={profile.title || "智慧水利 · 水信息"} />
          </p>
          {profile.tagline && (
            <p className="text-base md:text-lg text-white/75 max-w-md leading-relaxed mx-auto sm:mx-0">
              {profile.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2">
            <a
              href="/hydrobench"
              className="btn-primary"
              onClick={() => trackCta("nav-hydrobench", "hero-智慧水利")}
            >
              <Icon icon="mdi:water" width={18} />
              智慧水利
            </a>
            <a
              href="#works"
              className="btn-outline"
              onClick={() => trackClick("hero-works", "作品")}
            >
              作品档案
            </a>
            <a
              href="#sponsor"
              className="btn-outline"
              onClick={() => trackClick("hero-sponsor", "赞助")}
            >
              <Icon icon="mdi:coffee" width={18} />
              赞助
            </a>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex gap-3 justify-center sm:justify-start mt-2">
              {socialLinks.map(({ icon, href, label, target }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-white/15 backdrop-blur-sm hover:bg-[#e44c65]/35 transition-colors"
                  aria-label={label}
                  onClick={() => trackClick(target, label)}
                >
                  <Icon icon={icon} width={20} />
                </a>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative"
        >
          <div
            className="rounded-full overflow-hidden w-56 h-56 md:w-72 md:h-72
                       transform transition-transform duration-500 hover:scale-110 shadow-avatar
                       ring-4 ring-white/25"
          >
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#e44c65]/80 to-[#f5ae73]/70 flex items-center justify-center">
                <span className="font-display text-6xl text-white drop-shadow-lg">
                  {profile.name.slice(0, 1)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function About({ profile }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => observeAttention(ref.current, "section-about"), []);
  if (!profile.bio) return null;

  const traits = [
    { icon: "mdi:chart-timeline-variant", label: "站网态势与质控" },
    { icon: "mdi:brain", label: "径流预报实验" },
    { icon: "mdi:hammer-wrench", label: "野外数据工具台" },
    { icon: "mdi:palette-outline", label: "可演示产品形态" },
  ];

  return (
    <section id="about" ref={ref} className="section-padding">
      <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-8 md:p-12 grid md:grid-cols-[0.85fr_1.15fr] gap-10 items-center">
        <div className="rounded-2xl bg-white/10 p-6 flex items-center justify-center">
          <img
            src="/media/undraw/scientist_5td0.svg"
            alt="unDraw scientist"
            className="w-full max-h-52 object-contain drop-shadow-lg"
          />
        </div>
        <div>
          <p className="eyebrow mb-3">About</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-5 text-shadow">
            关于我
          </h2>
          <p className="text-white/85 leading-relaxed whitespace-pre-line mb-8">
            {profile.bio}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {traits.map((t) => (
              <div key={t.label} className="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 flex items-center gap-2">
                <Icon icon={t.icon} className="text-[#ff9aab] text-xl shrink-0" />
                <span className="text-sm text-white/90">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function Contact({ profile }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => observeAttention(ref.current, "section-contact"), []);

  const contacts = [
    {
      icon: "mdi:email-outline",
      label: "邮箱",
      value: profile.email,
      href: profile.email ? `mailto:${profile.email}` : null,
    },
    {
      icon: "mdi:phone-outline",
      label: "电话",
      value: profile.phone,
      href: profile.phone ? `tel:${profile.phone}` : null,
    },
    {
      icon: "mdi:map-marker-outline",
      label: "位置",
      value: profile.location,
      href: null,
    },
  ].filter((c) => c.value);

  return (
    <section id="contact" ref={ref} className="section-padding">
      <div className="max-w-5xl mx-auto">
        <div className="glass-panel rounded-[2rem] p-8 md:p-12">
          <p className="eyebrow mb-3">Contact</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 text-shadow">联系与协作</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {contacts.map(({ icon, label, value, href }) => (
              <div key={label} className="rounded-2xl bg-white/10 border border-white/15 p-5">
                <Icon icon={icon} className="text-2xl text-[#ff9aab] mb-2" />
                <p className="text-sm text-white/55 mb-1">{label}</p>
                {href ? (
                  <a href={href} className="text-white hover:text-[#ff9aab] break-all">
                    {value}
                  </a>
                ) : (
                  <p className="text-white">{value}</p>
                )}
              </div>
            ))}
          </div>
          {profile.wechat && (
            <p className="text-white/60 text-sm mt-6">微信：{profile.wechat}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function Sponsor({ profile }: HeroProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => observeAttention(ref.current, "section-sponsor"), []);
  const hasLink = Boolean(profile.sponsorUrl);
  const hasQr = Boolean(profile.sponsorQr);

  return (
    <section id="sponsor" ref={ref} className="section-padding pt-4">
      <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="eyebrow mb-3">Sponsor</p>
          <h2 className="font-display text-3xl font-bold mb-4 text-shadow">赞助贴</h2>
          <p className="text-white/75 leading-relaxed mb-6">
            {profile.sponsorNote ||
              "若演示或工具对你有帮助，可通过外链打开收款页 / 扫码赞助。资金用于服务器与开源维护。"}
          </p>
          {hasLink ? (
            <a
              href={profile.sponsorUrl!}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              onClick={() => trackCta("sponsor-external", "赞助外链")}
            >
              <Icon icon="mdi:open-in-new" width={18} />
              打开赞助收款页
            </a>
          ) : (
            <p className="text-sm text-white/50">后台「个人信息」可填写赞助外链与收款码。</p>
          )}
        </div>
        <div className="rounded-2xl bg-white/10 border border-white/15 p-8 flex flex-col items-center justify-center min-h-[240px]">
          {hasQr ? (
            <img
              src={profile.sponsorQr!}
              alt="赞助收款码"
              className="w-44 h-44 object-contain rounded-xl bg-white p-2"
            />
          ) : (
            <>
              <img
                src="/media/undraw/coffee-time_98vi.svg"
                alt="unDraw coffee"
                className="w-40 h-auto mb-3"
              />
              <p className="text-xs text-white/50">暂未配置收款码</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function FeedbackForm() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => observeAttention(ref.current, "section-feedback"), []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          page: typeof location !== "undefined" ? location.pathname : "/",
        }),
      });
      if (!res.ok) throw new Error("fail");
      setStatus("ok");
      setMessage("");
      trackCta("feedback-submit", "意见反馈");
    } catch {
      setStatus("err");
    }
    setBusy(false);
  }

  return (
    <section id="feedback" ref={ref} className="section-padding">
      <div className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-8 md:p-12 grid md:grid-cols-[0.8fr_1.2fr] gap-10">
        <div className="rounded-2xl bg-white/10 p-6 flex flex-col justify-center">
          <img
            src="/media/undraw/feedback_ebmx.svg"
            alt="unDraw feedback"
            className="w-full max-h-44 object-contain mb-4"
          />
          <p className="text-sm text-white/65 leading-relaxed">
            直接说哪里好用、哪里卡住。反馈进后台独立表，不覆盖个人资料。
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Feedback</p>
          <h2 className="font-display text-3xl font-bold mb-6 text-shadow">意见反馈</h2>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-field">称呼（可选）</label>
                <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label-field">邮箱（可选）</label>
                <input
                  className="input-field"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label-field">想说的话 *</label>
              <textarea
                className="input-field min-h-[120px] resize-y"
                required
                minLength={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                <Icon icon="mdi:send" width={18} />
                {busy ? "提交中…" : "发送反馈"}
              </button>
              {status === "ok" && <span className="text-[#a8e4f5] text-sm">已收到，谢谢。</span>}
              {status === "err" && <span className="text-[#ff9aab] text-sm">提交失败，请稍后重试。</span>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
