import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="font-display text-6xl font-bold mb-4">404</h1>
        <p className="text-ink-400 mb-8">找不到这个页面</p>
        <Link href="/" className="btn-primary">
          返回首页
        </Link>
      </div>
    </div>
  );
}
