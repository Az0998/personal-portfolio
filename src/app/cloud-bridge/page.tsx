import type { Metadata } from "next";
import Link from "next/link";
import "./cloud-bridge.css";

export const metadata: Metadata = {
  title: "跨云复制 | 张森捷",
  description: "Windows 本地程序：把百度网盘文件复制到夸克。核对账号、目录和是否保留原文件之后才开始。",
};

const STEPS = [
  "在这台电脑上登录百度网盘和夸克网盘。如果已经用无隅登录过，程序会直接读到本机保存的会话。",
  "打开程序，确认页头同时出现两个网盘。缺登录时不能开始复制。",
  "左边勾选要复制的文件或文件夹，右边打开要放入的目录。",
  "点「复制到右侧当前目录」。弹窗会列出文件名、目标路径，以及会不会删除来源。默认不删除百度里的原文件。",
  "确认后看进度。同名且大小相同的文件会跳过。失败的可以再复制一次，只会补还没过去的文件。",
];

export default function CloudBridgePage() {
  return (
    <div className="cb-root">
      <header className="cb-top">
        <Link href="/#works" className="cb-back">
          ← 作品集
        </Link>
        <span>本机工具</span>
      </header>
      <main className="cb-wrap">
        <p className="cb-kicker">WINDOWS</p>
        <h1>跨云复制</h1>
        <p className="cb-lead">
          在你自己的电脑上，把百度网盘里的文件复制到夸克。程序编译成 Windows 可执行文件分发，网站只放说明和下载，不接收网盘账号，也不代传文件。
        </p>
        <div className="cb-actions">
          <a className="cb-download" href="/downloads/CloudBridge-windows.zip">
            下载 Windows 版
          </a>
          <a className="cb-quiet" href="#steps">
            使用顺序
          </a>
        </div>
        <p className="cb-note">解压后运行 CloudBridge.exe。它只监听本机 127.0.0.1，并打开操作页。</p>

        <h2 id="steps">使用顺序</h2>
        <ol>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <div className="cb-card">
          <h2>网页上能做什么</h2>
          <p>
            这一页就是网页入口：看步骤、下载程序。真正的目录浏览和复制必须在本机完成，因为登录会话留在你的电脑上，不会发到这个网站。
          </p>
        </div>
      </main>
    </div>
  );
}
