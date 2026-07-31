"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { trackClick } from "@/lib/analytics";

export function Navbar({ name }: { name: string }) {
  const links = [
    { href: "#about", label: "关于" },
    { href: "#works", label: "作品" },
    { href: "/hydrobench", label: "智慧水利", route: true },
    { href: "#sponsor", label: "赞助" },
    { href: "#feedback", label: "反馈" },
    { href: "/temp-files", label: "临时柜", route: true },
    { href: "#contact", label: "联系" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold text-ember-soft tracking-wide">
          {name}
        </Link>

        <div className="flex items-center gap-5 md:gap-7">
          {links.map((link) =>
            link.route ? (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-300 hover:text-ember-soft transition-colors hidden sm:block"
                onClick={() => trackClick(`nav-${link.label}`, link.label)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-ink-300 hover:text-ember-soft transition-colors hidden sm:block"
                onClick={() => trackClick(`nav-${link.label}`, link.label)}
              >
                {link.label}
              </a>
            )
          )}
          <Link
            href="/admin"
            className="p-2 text-ink-400 hover:text-ember-soft transition-colors"
            title="管理后台"
          >
            <Icon icon="mdi:cog-outline" width={18} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="border-t border-white/[0.06] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-500">
        <p>
          &copy; {new Date().getFullYear()} {name}. 深色留白 · 暖色点缀 · 可演示的水文工具。
        </p>
        <p className="text-ember/70">zhangsjqaq.vexr.dev</p>
      </div>
    </footer>
  );
}
