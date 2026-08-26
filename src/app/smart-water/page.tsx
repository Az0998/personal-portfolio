import type { Metadata } from "next";
import Link from "next/link";
import "./smart-water.css";

export const metadata: Metadata = {
  title: "智慧水利管理系统 | 张森捷",
  description:
    "SpringBoot + Vue 前后端分离：考勤打卡、水事任务、测报上报、仪器借用与防汛物资管理。",
};

export default function SmartWaterPage() {
  return (
    <div className="sw-root">
      <header className="sw-top">
        <Link href="/#works" className="sw-back">
          ← 作品集
        </Link>
        <div className="sw-brand">
          <span className="sw-mark">水</span>
          <div>
            <div className="sw-title">智慧水利管理系统</div>
            <div className="sw-sub">巡测员 lintao / 123456 · 管理员 admin / admin123</div>
          </div>
        </div>
        <a className="sw-open" href="/smart-water/index.html" target="_blank" rel="noreferrer">
          新窗口
        </a>
      </header>
      <iframe
        className="sw-frame"
        title="智慧水利管理系统"
        src="/smart-water/index.html?embed=1"
        allow="clipboard-write"
      />
    </div>
  );
}
