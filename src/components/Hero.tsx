"use client";

import { motion } from "framer-motion";
import { Mail, MapPin, Github, Linkedin, Twitter, Globe, Phone, Sparkles } from "lucide-react";
import { SakuraPetals, StarField } from "@/components/AnimeDecor";

interface Profile {
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
}

interface HeroProps {
  profile: Profile;
}

export function Hero({ profile }: HeroProps) {
  const socialLinks = [
    { icon: Github, href: profile.github, label: "GitHub" },
    { icon: Linkedin, href: profile.linkedin, label: "LinkedIn" },
    { icon: Twitter, href: profile.twitter, label: "Twitter" },
    { icon: Globe, href: profile.website, label: "Website" },
  ].filter((l) => l.href);

  return (
    <section className="relative min-h-screen flex items-center section-padding overflow-hidden">
      <StarField />
      <SakuraPetals />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-sakura/15 rounded-full blur-[120px] animate-pulse-soft" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-aqua/12 rounded-full blur-[100px] animate-pulse-soft" />
      </div>

      <div className="relative max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="inline-flex items-center gap-2 text-sakura-soft font-cute mb-4 tracking-wide text-sm">
            <Sparkles className="w-4 h-4" />
            Anime × Hydrology × Maker
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-4 leading-tight">
            {profile.name}
          </h1>
          <p className="text-xl md:text-2xl text-ink-200 mb-2">{profile.title}</p>
          {profile.tagline && (
            <p className="text-lg text-ink-400 mb-8">{profile.tagline}</p>
          )}

          <div className="flex flex-wrap gap-4 mb-8">
            <a href="#works" className="btn-primary">
              进入作品世界
            </a>
            <a href="#contact" className="btn-outline">
              联系我
            </a>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 glass rounded-full hover:bg-sakura/20 hover:border-sakura/40 transition-all"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative animate-float-slow">
            <div className="absolute inset-0 bg-gradient-to-br from-sakura/40 to-aqua/30 rounded-[2rem] blur-2xl scale-110" />
            <div className="relative w-72 h-80 md:w-80 md:h-96 rounded-[2rem] overflow-hidden glass border-sakura/20 shadow-sakura">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-night-mist via-sakura/20 to-aqua/20 flex flex-col items-center justify-center gap-3">
                  <span className="text-7xl animate-float">🌙</span>
                  <span className="font-display text-4xl text-sakura-soft">
                    {profile.name.slice(0, 1)}
                  </span>
                  <span className="font-cute text-sm text-ink-300">夜空下的创作者</span>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-night/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <span className="font-cute text-xs text-sakura-soft px-2 py-1 rounded-full bg-night/50 border border-sakura/30">
                  Lv.水文魔法使
                </span>
                <span className="text-aqua text-xs">✦ zhangsjqaq</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function About({ profile }: HeroProps) {
  if (!profile.bio) return null;

  const traits = [
    { icon: "🌊", label: "水文 × ML" },
    { icon: "🦉", label: "二次元桌宠" },
    { icon: "🛠️", label: "工具建造癖" },
    { icon: "🌿", label: "自然观察" },
  ];

  return (
    <section id="about" className="section-padding">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            关于<span className="gradient-text">我</span>
          </h2>
          <p className="text-ink-400 mb-10">一个喜欢用代码讲故事的人</p>
          <p className="text-lg text-ink-200 leading-relaxed whitespace-pre-line mb-10">
            {profile.bio}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {traits.map((t) => (
              <div key={t.label} className="anime-card p-4 text-center">
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="text-sm text-ink-300 font-cute">{t.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Contact({ profile }: HeroProps) {
  const contacts = [
    { icon: Mail, label: "邮箱", value: profile.email, href: profile.email ? `mailto:${profile.email}` : null },
    { icon: Phone, label: "电话", value: profile.phone, href: profile.phone ? `tel:${profile.phone}` : null },
    { icon: MapPin, label: "位置", value: profile.location, href: null },
  ].filter((c) => c.value);

  return (
    <section id="contact" className="section-padding">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            联系<span className="gradient-text">方式</span>
          </h2>
          <p className="text-ink-400">欢迎交流合作，随时联系</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.map(({ icon: Icon, label, value, href }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="anime-card p-6 text-center hover:border-sakura/40"
            >
              <Icon className="w-6 h-6 text-sakura-soft mx-auto mb-3" />
              <p className="text-sm text-ink-400 mb-1">{label}</p>
              {href ? (
                <a href={href} className="text-white hover:text-sakura-soft transition-colors">
                  {value}
                </a>
              ) : (
                <p className="text-white">{value}</p>
              )}
            </motion.div>
          ))}
        </div>

        {profile.wechat && (
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-ink-400 mt-8"
          >
            微信：{profile.wechat}
          </motion.p>
        )}
      </div>
    </section>
  );
}
