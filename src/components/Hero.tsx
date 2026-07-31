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

export function Hero({ profile }: HeroProps) {
  const socialLinks = [
    { icon: "mdi:github", href: profile.github, label: "GitHub", target: "social-github" },
    { icon: "mdi:linkedin", href: profile.linkedin, label: "LinkedIn", target: "social-linkedin" },
    { icon: "mdi:twitter", href: profile.twitter, label: "Twitter", target: "social-twitter" },
    { icon: "mdi:web", href: profile.website, label: "Website", target: "social-website" },
  ].filter((l) => l.href);

  return (
    <section className="relative min-h-[92vh] flex items-center section-padding overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: "url(/media/photos/river-pexels.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-night via-night/85 to-night" />
      </div>

      <div className="relative max-w-6xl mx-auto w-full grid lg:grid-cols-[1.15fr_0.85fr] gap-16 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow mb-5 flex items-center gap-2">
            <Icon icon="mdi:waves" className="text-lg text-teal-soft" />
            智慧水利 · 水信息 · 可演示工具
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-5 leading-[1.08] tracking-tight">
            {profile.name}
          </h1>
          <p className="text-xl md:text-2xl text-ink-200 mb-3">{profile.title}</p>
          {profile.tagline && (
            <p className="text-base md:text-lg text-ink-400 mb-8 max-w-xl leading-relaxed">
              {profile.tagline}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mb-10">
            <a
              href="/hydrobench"
              className="btn-primary"
              onClick={() => trackCta("nav-hydrobench", "hero-智慧水利")}
            >
              <Icon icon="mdi:water-pump" width={18} />
              进入智慧水利工作台
            </a>
            <a
              href="#works"
              className="btn-outline"
              onClick={() => trackClick("hero-works", "作品")}
            >
              查看作品档案
            </a>
            <a
              href="#sponsor"
              className="btn-outline"
              onClick={() => trackClick("hero-sponsor", "赞助")}
            >
              <Icon icon="mdi:coffee-outline" width={18} />
              赞助
            </a>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex gap-3">
              {socialLinks.map(({ icon, href, label, target }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glass rounded-2xl hover:border-ember/40 transition-all"
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
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-ember/10 blur-3xl rounded-full" />
          <div className="media-panel relative p-6 md:p-8">
            <img
              src="/media/undraw/scientist_5td0.svg"
              alt="unDraw scientist illustration"
              className="w-full h-auto max-h-[320px] object-contain mb-4"
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="/media/photos/ocean-pexels.jpg"
                  alt="Pexels ocean"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="/media/placeholders/river-1015.jpg"
                  alt="Picsum river placeholder"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="mt-4 text-xs text-ink-500 leading-relaxed">
              插画 unDraw · 实拍 Pexels · 占位 Picsum · 图标 Iconify
            </p>
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
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-16 items-center">
        <div className="media-panel p-8">
          <img
            src="/media/undraw/data-analysis.svg"
            alt="unDraw data analysis"
            className="w-full max-h-64 object-contain"
          />
        </div>
        <div>
          <p className="eyebrow mb-3">About</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 leading-tight">
            用信息链路读懂河流，<span className="gradient-text">把预报做成可点开的产品</span>
          </h2>
          <p className="text-ink-300 leading-relaxed whitespace-pre-line mb-8 text-base md:text-lg">
            {profile.bio}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {traits.map((t) => (
              <div key={t.label} className="anime-card p-4 flex items-center gap-3">
                <Icon icon={t.icon} className="text-ember-soft text-xl shrink-0" />
                <span className="text-sm text-ink-200">{t.label}</span>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-14 max-w-2xl">
          <p className="eyebrow mb-3">Contact</p>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            联系与协作
          </h2>
          <p className="text-ink-400 leading-relaxed">
            欢迎就智慧水利岗位、水文工具、演示部署或开源协作写信。以下渠道均可触达。
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {contacts.map(({ icon, label, value, href }) => (
            <div key={label} className="anime-card p-6">
              <Icon icon={icon} className="text-2xl text-ember-soft mb-3" />
              <p className="text-sm text-ink-500 mb-1">{label}</p>
              {href ? (
                <a href={href} className="text-ink-100 hover:text-ember-soft transition-colors break-all">
                  {value}
                </a>
              ) : (
                <p className="text-ink-100">{value}</p>
              )}
            </div>
          ))}
        </div>

        {profile.wechat && (
          <p className="text-ink-500 text-sm">微信：{profile.wechat}</p>
        )}
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
    <section id="sponsor" ref={ref} className="section-padding pt-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow mb-3">Sponsor</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            赞助贴 · 一杯咖啡的温度
          </h2>
          <p className="text-ink-400 leading-relaxed mb-6">
            {profile.sponsorNote ||
              "若演示或工具对你有帮助，可通过外链打开收款页 / 扫码赞助。资金用于服务器与开源维护，与站点个人资料、作品 CMS 数据分离。"}
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
            <p className="text-sm text-ink-500">
              管理员可在后台「个人信息」填写赞助外链与收款码。
            </p>
          )}
        </div>
        <div className="media-panel p-8 flex flex-col items-center justify-center min-h-[280px]">
          {hasQr ? (
            <img
              src={profile.sponsorQr!}
              alt="赞助收款码"
              className="w-48 h-48 object-contain rounded-2xl bg-white p-3"
            />
          ) : (
            <>
              <img
                src="/media/undraw/coffee-time_98vi.svg"
                alt="unDraw coffee"
                className="w-48 h-auto mb-4 opacity-90"
              />
              <p className="text-xs text-ink-500 text-center">
                暂未配置收款码图片 · 请走外链或后台上传
              </p>
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
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.85fr_1.15fr] gap-14 items-start">
        <div className="media-panel p-8">
          <img
            src="/media/undraw/feedback_ebmx.svg"
            alt="unDraw feedback"
            className="w-full max-h-56 object-contain"
          />
          <p className="text-sm text-ink-400 mt-6 leading-relaxed">
            直接说哪里好用、哪里卡住、想加什么能力。后台可逐条查看，不与个人资料字段混写。
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Feedback</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">意见反馈</h2>
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
                className="input-field min-h-[140px] resize-y"
                required
                minLength={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例如：HydroBench 户外台希望增加……"
              />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
                <Icon icon="mdi:send-outline" width={18} />
                {busy ? "提交中…" : "发送反馈"}
              </button>
              {status === "ok" && <span className="text-teal-soft text-sm">已收到，谢谢。</span>}
              {status === "err" && <span className="text-ember text-sm">提交失败，请稍后重试。</span>}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
