"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

export function Navbar({ name }: { name: string }) {
  const links = [
    { href: "#about", label: "关于" },
    { href: "#works", label: "作品" },
    { href: "/hydro", label: "水情演示" },
    { href: "#contact", label: "联系" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-sakura/10">
      <div className="max-w-6xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold text-sakura-soft">
          ✦ {name}
        </Link>

        <div className="flex items-center gap-8">
          {links.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink-300 hover:text-sakura-soft transition-colors hidden sm:block"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-ink-300 hover:text-sakura-soft transition-colors hidden sm:block"
              >
                {link.label}
              </a>
            )
          )}
          <Link
            href="/admin"
            className="p-2 text-ink-400 hover:text-sakura-soft transition-colors"
            title="管理后台"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="border-t border-sakura/10 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-ink-500">
        <p>&copy; {new Date().getFullYear()} {name}. 用代码守护一点浪漫。</p>
        <p className="font-cute text-sakura/70">zhangsjqaq.vexr.dev</p>
      </div>
    </footer>
  );
}
