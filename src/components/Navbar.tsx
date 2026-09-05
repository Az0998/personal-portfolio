"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { trackClick } from "@/lib/analytics";

export function Navbar({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = [
    { href: "/", label: "主页", match: (p: string) => p === "/" },
    {
      href: "/hydrobench",
      label: "智慧水利",
      match: (p: string) =>
        p.startsWith("/hydro") ||
        p.startsWith("/watershed-map") ||
        p.startsWith("/xaj") ||
        p.startsWith("/water-balance"),
    },
    { href: "/#works", label: "作品" },
    { href: "/#about", label: "关于" },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function renderLink(link: (typeof links)[number], mobile = false) {
    const active = link.match ? link.match(pathname) : false;
    const Comp = link.href.startsWith("/#") || link.href === "/" ? "a" : Link;
    const className = mobile
      ? `block w-full text-left px-4 py-3 rounded-xl ${active ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10"}`
      : `nav-pill ${active ? "nav-pill-active" : ""}`;
    const onClick = () => {
      trackClick(`nav-${link.label}`, link.label);
      setOpen(false);
    };
    if (Comp === "a") {
      return (
        <a href={link.href} className={className} onClick={onClick}>
          {link.label}
        </a>
      );
    }
    return (
      <Link href={link.href} className={className} onClick={onClick}>
        {link.label}
      </Link>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full drop-shadow-lg">
      <div className="flex justify-between items-center h-16 px-5 md:px-8">
        <Link href="/" className="font-display text-lg text-white text-shadow tracking-wide">
          {name}
        </Link>

        <ul className="hidden sm:flex gap-3 items-center">
          {links.map((link) => (
            <li key={link.href}>{renderLink(link)}</li>
          ))}
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

        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon icon={open ? "mdi:close" : "mdi:menu"} width={22} />
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden px-4 pb-4">
          <ul className="glass-panel rounded-2xl p-2 space-y-1 border border-white/15">
            {links.map((link) => (
              <li key={link.href}>{renderLink(link, true)}</li>
            ))}
            <li>
              <Link
                href="/admin"
                className="block w-full text-left px-4 py-3 rounded-xl text-white/70 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                管理后台
              </Link>
            </li>
          </ul>
        </div>
      )}
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
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center text-white/45">
        <a href="/#sponsor" className="hover:text-[#ff9aab] transition-colors">
          赞助
        </a>
        <a href="/#feedback" className="hover:text-[#ff9aab] transition-colors">
          反馈
        </a>
        <a href="/temp-files" className="hover:text-[#ff9aab] transition-colors">
          临时文件柜
        </a>
        <a href="/#contact" className="hover:text-[#ff9aab] transition-colors">
          联系
        </a>
      </p>
    </footer>
  );
}
