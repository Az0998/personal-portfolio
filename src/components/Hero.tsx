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

/** 打字机一行（对齐 dayabolg Typewriter）；尊重 reduced-motion */
function TypeLine({ text }: { text: string }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(text);
      return;
    }
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
    <span className="inline-block min-h-[1.5em] text-pretty">
      {shown}
      <span className="inline-block w-[0.55ch] h-[1em] ml-0.5 align-[-0.1em] bg-[#e44c65] animate-pulse motion-reduce:hidden" />
    </span>
  );
}

export function Hero({ profile }: HeroProps) {
  const loop = "采集 → 空间 → 态势 → 预报 → 文档";

  return (
    <section className="relative z-[1] min-h-[calc(100dvh-4rem)] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl flex flex-col-reverse sm:flex-row gap-10 sm:gap-14 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex flex-col text-center sm:text-left justify-center gap-4 text-white text-shadow
                     transform transition-transform duration-150 ease-out hover:scale-[1.02]"
        >
          <p className="text-[#ff9aab] text-sm tracking-[0.2em] uppercase">智慧水利 / 水信息</p>
          <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight text-balance">
            {profile.name}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-light">
            <TypeLine text={profile.title || "智慧水利 · 水信息"} />
          </p>
          <p className="text-base md:text-lg text-white/85 max-w-lg leading-relaxed mx-auto sm:mx-0 font-medium tracking-wide">
            {loop}
          </p>
          <p className="text-sm text-white/55 max-w-md leading-relaxed mx-auto sm:mx-0">
            面向河海水信息导师、南京 / 广州智慧水利与设计院信息化岗位的可演示主链。
          </p>

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start mt-2">
            <a
              href="/hydrobench"
              className="btn-primary"
              aria-label="进入智慧水利总览"
              onClick={() => trackCta("nav-hydro-hub", "hero-进入智慧水利")}
            >
              <Icon icon="mdi:water" width={18} />
              进入智慧水利
            </a>
          </div>
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
    { icon: "mdi:database-import-outline", label: "采集与整编" },
    { icon: "mdi:map-outline", label: "空间落点" },
    { icon: "mdi:chart-timeline-variant", label: "态势与质控" },
    { icon: "mdi:weather-pouring", label: "预报与论证文档" },
  ];

  return (
    <section id="about" ref={ref} className="section-padding">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-8 md:p-12 grid md:grid-cols-[0.85fr_1.15fr] gap-10 items-center"
      >
        <div className="rounded-2xl bg-white/10 p-6 flex items-center justify-center">
          <img
            src="/media/undraw/scientist_5td0.svg"
            alt=""
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
          <div className="flex flex-wrap gap-3 mb-8">
            <a href="/hydrobench" className="btn-primary">
              <Icon icon="mdi:water" width={18} />
              进入智慧水利
            </a>
            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
                onClick={() => trackClick("about-github", "GitHub")}
              >
                <Icon icon="mdi:github" width={18} />
                GitHub
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {traits.map((t) => (
              <div key={t.label} className="rounded-2xl bg-white/10 border border-white/15 px-3 py-3 flex items-center gap-2">
                <Icon icon={t.icon} className="text-[#ff9aab] text-xl shrink-0" />
                <span className="text-sm text-white/90">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
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
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-[2rem] p-8 md:p-12"
        >
          <p className="eyebrow mb-3">Contact</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 text-shadow">联系与协作</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {contacts.map(({ icon, label, value, href }) => (
              <motion.div
                key={label}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-white/10 border border-white/15 p-5"
              >
                <Icon icon={icon} className="text-2xl text-[#ff9aab] mb-2" />
                <p className="text-sm text-white/55 mb-1">{label}</p>
                {href ? (
                  <a href={href} className="text-white hover:text-[#ff9aab] break-all">
                    {value}
                  </a>
                ) : (
                  <p className="text-white">{value}</p>
                )}
              </motion.div>
            ))}
          </div>
          {profile.wechat && (
            <p className="text-white/60 text-sm mt-6">微信：{profile.wechat}</p>
          )}
        </motion.div>
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
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-5xl mx-auto glass-panel rounded-[2rem] p-8 md:p-12 grid md:grid-cols-2 gap-10 items-center"
      >
        <div>
          <p className="eyebrow mb-3">Sponsor</p>
          <h2 className="font-display text-3xl font-bold mb-4 text-shadow">赞助贴</h2>
          <p className="text-white/75 leading-relaxed mb-6">
            {profile.sponsorNote ||
              "若这些演示或工具对你有帮助，欢迎赞助支持服务器与开源维护。"}
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
              打开赞助页
            </a>
          ) : hasQr ? null : (
            <p className="text-sm text-white/50">赞助通道筹备中。</p>
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
            <img
              src="/media/undraw/coffee-time_98vi.svg"
              alt=""
              className="w-40 h-auto opacity-90"
            />
          )}
        </div>
      </motion.div>
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
            alt=""
            className="w-full max-h-44 object-contain mb-4"
          />
          <p className="text-sm text-white/65 leading-relaxed">
            欢迎留下体验感受或改进建议。
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
