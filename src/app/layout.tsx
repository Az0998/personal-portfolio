import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "张森捷 · 作品集",
  description: "水文 · 机器学习 · 二次元创作者的个人作品集",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
