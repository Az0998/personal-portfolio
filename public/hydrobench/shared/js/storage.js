/**
 * HydroBench 本地持久化
 * - 键前缀 hydrobench:（与 Novel Studio / 站点 Prisma 个人资料隔离）
 * - 同源（含个人站 /hydrobench iframe）共享同一套 localStorage
 * - 不同源（file://、localhost、生产域名）互不同步，请用导出 JSON 迁移
 */
(function (global) {
  const PREFIX = "hydrobench:";
  const META_KEY = "meta";

  function key(name) {
    return PREFIX + name;
  }

  function load(name, fallback) {
    try {
      const raw = localStorage.getItem(key(name));
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function save(name, value) {
    localStorage.setItem(key(name), JSON.stringify(value));
    touchMeta();
  }

  function remove(name) {
    localStorage.removeItem(key(name));
    touchMeta();
  }

  function touchMeta() {
    try {
      const prev = load(META_KEY, {});
      localStorage.setItem(
        key(META_KEY),
        JSON.stringify({
          version: 1,
          updatedAt: new Date().toISOString(),
          origin: typeof location !== "undefined" ? location.origin : "",
          keys: listNames(),
          ...prev,
          version: 1,
          updatedAt: new Date().toISOString(),
          origin: typeof location !== "undefined" ? location.origin : "",
          keys: listNames(),
        })
      );
    } catch (_) { /* quota / private mode */ }
  }

  function listNames() {
    const names = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX) && k !== key(META_KEY)) {
          names.push(k.slice(PREFIX.length));
        }
      }
    } catch (_) { /* ignore */ }
    return names.sort();
  }

  function snapshot() {
    const data = {};
    listNames().forEach((name) => {
      data[name] = load(name, null);
    });
    return {
      type: "hydrobench-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      origin: typeof location !== "undefined" ? location.origin : "",
      path: typeof location !== "undefined" ? location.pathname : "",
      data,
    };
  }

  function restore(backup, opts) {
    opts = opts || {};
    if (!backup || backup.type !== "hydrobench-backup" || !backup.data) {
      throw new Error("不是 hydrobench-backup");
    }
    if (opts.clearFirst) {
      listNames().forEach((name) => localStorage.removeItem(key(name)));
    }
    Object.keys(backup.data).forEach((name) => {
      save(name, backup.data[name]);
    });
    touchMeta();
  }

  function originInfo() {
    const origin = typeof location !== "undefined" ? location.origin : "";
    const onlineHost =
      typeof location !== "undefined" &&
      /zhangsjqaq\.vexr\.dev$/i.test(location.hostname);
    return {
      origin,
      hostname: typeof location !== "undefined" ? location.hostname : "",
      onlineHost,
      note: onlineHost
        ? "个人站同源：测次/公式历史保存在本浏览器，不写入站点个人资料库"
        : "当前源本地存储；换域名或 file:// 不会自动带上生产站数据，请导出备份迁移",
    };
  }

  function downloadText(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function downloadJSON(filename, obj) {
    downloadText(filename, JSON.stringify(obj, null, 2), "application/json");
  }

  function toast(msg, ms) {
    ms = ms || 2200;
    let el = document.getElementById("hydro-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "hydro-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), ms);
  }

  /** 在页面顶部插入同源存储提示条 */
  function mountBanner(target) {
    const info = originInfo();
    const names = listNames();
    const el = document.createElement("div");
    el.className = "hb-storage-banner";
    el.innerHTML =
      '<span class="hb-storage-dot"></span>' +
      "<span><strong>本机缓存</strong> · " +
      escapeHtml(info.origin || "local") +
      " · " +
      names.length +
      " 项 · " +
      escapeHtml(info.note) +
      "</span>";
    const host = typeof target === "string" ? document.querySelector(target) : target;
    if (host) host.insertAdjacentElement("afterbegin", el);
    else document.body.insertAdjacentElement("afterbegin", el);
    return el;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ensure meta exists once
  try {
    if (typeof localStorage !== "undefined") touchMeta();
  } catch (_) { /* ignore */ }

  global.HydroStorage = {
    PREFIX,
    load,
    save,
    remove,
    downloadText,
    downloadJSON,
    toast,
    key,
    listNames,
    snapshot,
    restore,
    originInfo,
    mountBanner,
  };
})(typeof window !== "undefined" ? window : globalThis);
