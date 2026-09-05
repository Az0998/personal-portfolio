"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { trackClick } from "@/lib/analytics";

export function Navbar({ name }: { name: string }) {
  const pathname = usePathname();
  const links = [
    { href: "/", label: "主页", match: (p: string) => p === "/" },
    { href: "/#works", label: "作品" },
    { href: "/hydrobench", label: "智慧水利", match: (p: string) => p.startsWith("/hydro") },
    { href: "/watershed-map", label: "流域图", match: (p: string) => p.startsWith("/watershed-map") },
    { href: "/xaj-bench", label: "机理对照", match: (p: string) => p.startsWith("/xaj") },
    { href: "/#sponsor", label: "赞助" },
    { href: "/#feedback", label: "反馈" },
    { href: "/temp-files", label: "临时柜", match: (p: string) => p.startsWith("/temp-files") },
    { href: "/#contact", label: "关于" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full flex justify-between items-center h-16 px-5 md:px-8 drop-shadow-lg">
      <Link href="/" className="font-display text-lg text-white text-shadow tracking-wide">
        {name}
      </Link>

      <ul className="hidden sm:flex gap-3 items-center">
        {links.map((link) => {
          const active = link.match ? link.match(pathname) : false;
          const Comp = link.href.startsWith("/#") || link.href === "/" ? "a" : Link;
          const className = `nav-pill ${active ? "nav-pill-active" : ""}`;
          const onClick = () => trackClick(`nav-${link.label}`, link.label);
          if (Comp === "a") {
            return (
              <li key={link.href}>
                <a href={link.href} className={className} onClick={onClick}>
                  {link.label}
                </a>
              </li>
            );
          }
          return (
            <li key={link.href}>
              <Link href={link.href} className={className} onClick={onClick}>
                {link.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Link
            href="/admin"
            className="p-2 rounded-full bg-white/15 backdrop-blur-sm text-white/80 hover:text-[#e44c65] transition-colors duration-150"
            title="管理后台"
            aria-label="管理后台"
          >
            <Icon icon="mdi:cog-outline" width={18} />
          </Link>
        </li>
      </ul>

      <Link
        href="/admin"
        className="sm:hidden p-2 rounded-full bg-white/20 backdrop-blur-sm text-white"
        aria-label="管理后台"
      >
        <Icon icon="mdi:apps" width={22} />
      </Link>
    </nav>
  );
}

export function Footer({ name }: { name: string }) {
  return (
    <footer className="relative z-[1] border-t border-white/10 py-8 px-6 text-center text-sm text-white/60 text-shadow">
      <p>
        &copy; {new Date().getFullYear()} {name}. 二次元一图流 · 智慧水利作品集
      </p>
      <p className="mt-1 text-[#ff9aab]/80">zhangsjqaq.vexr.dev</p>
    </footer>
  );
}
