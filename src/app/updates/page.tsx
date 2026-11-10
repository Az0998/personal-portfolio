import type { Metadata } from "next";
import Link from "next/link";
import { Navbar, Footer } from "@/components/Navbar";
import { SITE_UPDATES } from "@/data/site-updates";

export const metadata: Metadata = {
  title: "升级公告 | 张森捷",
  description: "智慧水利教学站与个人站的升级说明，课用入口优先。",
};

export default function UpdatesPage() {
  return (
    <div className="relative z-[1] min-h-dvh flex flex-col">
      <Navbar name="张森捷" />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">
        <p className="text-xs tracking-[0.18em] text-sky-300">SITE UPDATES</p>
        <h1 className="font-display mt-2 text-3xl">升级公告</h1>
        <p className="mt-3 max-w-xl text-sm leading-7 text-white/70">
          只记教学和科研主路径的改动。课上先看采集课堂，面试导览仍走五步作业链。阿里云课用机未上线前，公开地址就是本站。
        </p>
        <ol className="mt-8 space-y-6">
          {SITE_UPDATES.map((u) => (
            <li
              key={u.id}
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-4"
            >
              <p className="text-xs text-white/50">{u.date}</p>
              <h2 className="mt-1 text-lg text-white">{u.title}</h2>
              <p className="mt-2 text-sm leading-7 text-sky-100">{u.lead}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-7 text-white/75">
                {u.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link className="text-sky-300 underline decoration-sky-300/40" href="/sfl-lab">
            微型蒸渗仪七步
          </Link>
          <Link className="text-sky-300 underline decoration-sky-300/40" href="/hydrobench">
            智慧水利总览
          </Link>
        </p>
      </main>
      <Footer name="张森捷" />
    </div>
  );
}
