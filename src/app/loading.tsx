export default function RootLoading() {
  return (
    <div className="boot-screen" role="status" aria-live="polite" aria-label="页面加载中">
      <div className="boot-screen__orb" aria-hidden />
      <p className="boot-screen__brand">张森捷 · 作品集</p>
      <p className="boot-screen__hint">正在唤醒站点…</p>
      <div className="boot-screen__bar" aria-hidden>
        <span />
      </div>
    </div>
  );
}
