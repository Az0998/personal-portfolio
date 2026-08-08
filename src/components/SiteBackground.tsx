/** 固定铺满视口；直接用已部署的 HD hero，避免串行探测拖慢首屏 */
const HERO_SRC = "/media/pixiv/hero.webp";

export function SiteBackground() {
  return (
    <div className="site-bg" aria-hidden>
      <div
        className="site-bg-image"
        style={{ backgroundImage: `url(${HERO_SRC})` }}
      />
      <div className="site-bg-veil" />
      <div className="site-bg-grain" />
    </div>
  );
}
