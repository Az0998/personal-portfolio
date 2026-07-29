"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, User, FolderOpen, LogOut, ExternalLink, Plus,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "概览", icon: LayoutDashboard },
  { href: "/admin/profile", label: "个人信息", icon: User },
  { href: "/admin/works", label: "作品管理", icon: FolderOpen },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 glass border-r border-sakura/10 flex flex-col">
        <div className="p-6 border-b border-sakura/10">
          <h1 className="font-display text-lg font-bold text-sakura-soft">✦ Portfolio CMS</h1>
          <p className="text-xs text-ink-400 mt-1">内容管理后台</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                pathname === href || pathname.startsWith(href + "/")
                  ? "bg-sakura/20 text-sakura-soft"
                  : "text-ink-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            查看网站
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-ink-300 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-ink-400 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AddButton({ href }: { href: string }) {
  return (
    <Link href={href} className="btn-primary text-sm">
      <Plus className="w-4 h-4" />
      添加
    </Link>
  );
}
