import type { Metadata } from "next";
import Link from "next/link";
import "./xiangqi.css";

export const metadata: Metadata = {
  title: "中国象棋 · AlphaZero 策略网 | 张森捷",
  description:
    "自对弈训练的中国象棋策略网络：浏览器内 ONNX 推理对弈。完整 MCTS 训练管线在本地 Python。",
};

export default function XiangqiPage() {
  return (
    <div className="xq-root">
      <header className="xq-top">
        <Link href="/#works" className="xq-back">
          ← 作品集
        </Link>
        <div className="xq-brand">
          <span className="xq-mark">象</span>
          <div>
            <div className="xq-title">中国象棋 · 策略网络</div>
            <div className="xq-sub">ONNX · 自对弈 · 浏览器对弈</div>
          </div>
        </div>
        <a className="xq-open" href="/xiangqi/index.html" target="_blank" rel="noreferrer">
          新窗口
        </a>
      </header>
      <iframe
        className="xq-frame"
        title="中国象棋策略网络"
        src="/xiangqi/index.html?embed=1"
        allow="clipboard-write"
      />
    </div>
  );
}
