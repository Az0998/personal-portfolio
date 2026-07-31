import type { Metadata } from "next";
import Link from "next/link";
import "./hydrobench.css";

export const metadata: Metadata = {
  title: "智慧水利工作台 · HydroBench / HydroInfo | 张森捷",
  description:
    "智慧水利枢纽：水情态势看板 HydroInfo + 作业/实习双工作台 HydroBench（室内数据图片公式 · 户外应急离线）",
};

export default function HydroBenchPage() {
  return (
    <div className="hb-root">
      <header className="hb-top">
        <Link href="/" className="hb-back">
          ← 返回主站
        </Link>
        <div className="hb-brand">
          <span className="hb-mark">水</span>
          <div>
            <div className="hb-title">智慧水利</div>
            <div className="hb-sub">态势看板 · 作业工作台 · 同源缓存说明</div>
          </div>
        </div>
        <div className="hb-actions">
          <a className="hb-open" href="/hydrobench/index.html" target="_blank" rel="noreferrer">
            新窗口打开工作台
          </a>
        </div>
      </header>

      <section className="hb-hub">
        <a className="hb-hub-card" href="/hydro">
          <span className="hb-hub-kicker">HydroInfo</span>
          <strong>水情态势看板</strong>
          <p>多站 KPI · 过程线 · 质控 · 洪水 CSI · LSTM 指标。岗位向「采集→质控→态势→预报」闭环演示。</p>
        </a>
        <a className="hb-hub-card accent" href="#workbench">
          <span className="hb-hub-kicker">HydroBench</span>
          <strong>水文双工作台</strong>
          <p>室内：DAT/CSV/图片/公式。户外：无网测次、速算、清单与全量备份。浏览器本机缓存，不上云。</p>
        </a>
      </section>

      <p className="hb-note" id="workbench">
        测次记录、公式历史、清单勾选仅保存在浏览器 <code>localStorage</code>（前缀{" "}
        <code>hydrobench:</code>
        ），与站点个人资料 / 作品 CMS / Novel Studio 互不覆盖。换设备请用工作台「全量备份」。
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
