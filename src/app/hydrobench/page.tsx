import type { Metadata } from "next";
import Link from "next/link";
import "./hydrobench.css";

export const metadata: Metadata = {
  title: "HydroBench · 水文双工作台 | 张森捷",
  description:
    "室内集成 DAT/图片/公式与户外应急离线录入；浏览器本机缓存，不写入站点个人资料库",
};

export default function HydroBenchPage() {
  return (
    <div className="hb-root">
      <header className="hb-top">
        <Link href="/#works" className="hb-back">
          ← 返回作品集
        </Link>
        <div className="hb-brand">
          <span className="hb-mark">HB</span>
          <div>
            <div className="hb-title">HydroBench</div>
            <div className="hb-sub">水文双工作台 · 本机缓存与导出</div>
          </div>
        </div>
        <div className="hb-actions">
          <a className="hb-open" href="/hydrobench/index.html" target="_blank" rel="noreferrer">
            新窗口打开
          </a>
          <Link className="hb-open" href="/hydro">
            水情演示
          </Link>
        </div>
      </header>
      <p className="hb-note">
        测次记录、公式历史、清单勾选仅保存在你的浏览器 localStorage（键前缀{" "}
        <code>hydrobench:</code>
        ），与站点「个人资料 / 作品 CMS」及 Novel Studio 互不覆盖。换设备请用工作台内「全量备份」迁移。
      </p>
      <iframe
        className="hb-frame"
        title="HydroBench 水文双工作台"
        src="/hydrobench/index.html"
        allow="clipboard-write"
      />
    </div>
  );
}
