/* SmartField 微型蒸渗仪数据处理。
   依据中文手册第 2.3、3、4、6（10.4.1 所引）、10 章。
   AWAT / snap 的公式在处理笔记里是图，这里不算。 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.SFL = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const MODELS = {
    SFL300: {
      id: "SFL300",
      label: "SFL300 / PL-50",
      area: 0.0707,
      gateG: 5,
      accG: 7,
      normalMax: 50,
      absMax: 75,
      areaNote: "手册 10.3.1 给出的 0.0707 m²（内径 0.3 m）",
    },
    SFL600: {
      id: "SFL600",
      label: "SFL600 / PL-100",
      area: Math.PI * 0.3 * 0.3,
      gateG: 14,
      accG: 14,
      normalMax: 100,
      absMax: 150,
      areaNote: "手册只给出 SFL300 的面积。600 mm 直径按圆面积折算",
    },
    SFL900: {
      id: "SFL900",
      label: "SFL900 / PL-200",
      area: Math.PI * 0.45 * 0.45,
      gateG: 28,
      accG: 28,
      normalMax: 200,
      absMax: 300,
      areaNote: "手册只给出 SFL300 的面积。900 mm 直径按圆面积折算",
    },
  };

  const CLAUSES = {
    missing_weight: ["10.4.3", "重量缺测", "缺测未处理时，降水会被误读"],
    irregular_step: ["10.4.3", "采样间隔异常", "计时或通讯中断。电量正常时不应离开 1 分钟称重"],
    gap_power: ["6.2", "低电量拉长间隔", "SOC 低于 5% 时称重日程可变为约 1 小时"],
    spike: ["10.4.3", "孤立尖峰", "未剔除的峰值会被当成降水"],
    step: ["10.4.3", "重量台阶", "维护、收获或碰触造成的水平跃迁，已从水量中扣除"],
    bottle_service: ["10.2", "储水瓶阶跃", "注水或排水，不作为渗漏或蒸散"],
    wind_vibration: ["10.4.2.3", "风振", "来回跳动且净变化很小。该时段不计入降水"],
    wall_contact: ["10.4.2.1", "碰壁", "去掉匀速水量后，重量弯曲仍跟着温度走"],
    weight_nominal: ["2.3", "超出标称量程", "高于正常范围、尚未超过最大称重"],
    weight_overload: ["2.3", "超出最大量程", "超过该型号天平的最大称重"],
    soc_low: ["6.2", "电量低于 25%", "泵关闭。10.4.1 指向电源管理"],
    soc_sensor: ["6.1", "电量低于 10%", "表2：传感器与天平关闭。6.2 正文把传感器关闭写在 5%"],
    soc_critical: ["6.2", "电量低于 5%", "最低能耗，数采仍供电，称重变稀"],
    mps_sat: ["3.2", "MPS 近饱和失效", "MPS-2 在高于 −10 kPa 时不能工作"],
    mps_range: ["3.2", "MPS 超量程", "标称下限 −500 kPa"],
    vwc_range: ["3.3", "含水量超量程", "5TE 含水量通道，按 0–70% 检查"],
    ec_range: ["3.3", "电导率超量程", "5TE：0–23 mS/cm"],
    temp_range: ["3.3", "土温超量程", "5TE：−40–50 ℃"],
    field_temp_range: ["3.1", "野外土温超量程", "T8：−30–70 ℃"],
    tens_range: ["3.1", "参比张力超量程", "T8 物理范围约 −85–100 kPa"],
    vtens_air: ["3.4", "VTENS 进气", "接近 80 kPa 后跌向 0，反馈失效。4.3 写成约 80 hPa，与 −70 kPa 工作区间矛盾，按通道单位取 80 kPa"],
    feedback_band: ["4.3", "超出反馈区间", "底部反馈的工作区间是 +3 至 −70 kPa"],
    feedback_gap: ["4.2", "底部未跟上参比", "VTENS 与同深度张力计的偏离超过 5 kPa"],
    pump_on: ["10.1", "泵脉冲", "最短 1 秒抽气可在 VTENS 上形成尖峰，不计入自然通量"],
    tensiometer_refill: ["3.1", "参比张力计需补水", "填充指示为 1 时，参比值不能用来核对底部"],
  };

  function mmPerKg(model) {
    return 1 / model.area;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function normal(rng) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  function finite(x) {
    return Number.isFinite(x);
  }

  function median(vals) {
    const xs = vals.filter(finite).slice().sort((a, b) => a - b);
    if (!xs.length) return NaN;
    const m = Math.floor(xs.length / 2);
    return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
  }

  function rollingMedian(arr, win, minP, center) {
    const n = arr.length;
    const half = Math.floor(win / 2);
    const out = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      const a = center ? i - half : i - win + 1;
      const b = center ? i + half : i;
      const vals = [];
      for (let j = Math.max(0, a); j <= Math.min(n - 1, b); j++) {
        if (finite(arr[j])) vals.push(arr[j]);
      }
      if (vals.length < minP) continue;
      vals.sort((x, y) => x - y);
      const m = Math.floor(vals.length / 2);
      out[i] = vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
    }
    return out;
  }

  function rollingStat(arr, win, minP, kind) {
    const n = arr.length;
    const out = new Array(n).fill(NaN);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - win + 1);
      let s = 0;
      let s2 = 0;
      let c = 0;
      let peak = 0;
      for (let j = a; j <= i; j++) {
        if (!finite(arr[j])) continue;
        s += arr[j];
        s2 += arr[j] * arr[j];
        peak = Math.max(peak, Math.abs(arr[j]));
        c += 1;
      }
      if (c < minP) continue;
      const mean = s / c;
      if (kind === "meanAbs") out[i] = Math.abs(mean);
      else if (kind === "max") out[i] = peak;
      else {
        const v = c > 1 ? (s2 - c * mean * mean) / (c - 1) : 0;
        out[i] = Math.sqrt(Math.max(0, v));
      }
    }
    return out;
  }

  function mad(arr) {
    const xs = arr.filter(finite);
    if (!xs.length) return NaN;
    const m = median(xs);
    return median(xs.map((v) => Math.abs(v - m)));
  }

  function withoutSteps(arr) {
    const slow = rollingMedian(arr, 5, 3, true);
    const jumpAt = new Array(arr.length).fill(0);
    for (let i = 1; i < arr.length; i++) {
      if (!finite(slow[i]) || !finite(slow[i - 1])) continue;
      const jump = slow[i] - slow[i - 1];
      if (Math.abs(jump) <= 0.05) continue;
      const j = Math.min(arr.length - 1, i + 15);
      if (!finite(slow[j]) || Math.abs(slow[j] - slow[i - 1]) <= 0.05) continue;
      jumpAt[i] = jump;
    }
    const out = arr.slice();
    let acc = 0;
    for (let i = 0; i < arr.length; i++) {
      acc += jumpAt[i];
      if (finite(out[i])) out[i] -= acc;
    }
    return out;
  }

  function thermalWall(y, z, win) {
    win = win || 360;
    const n = y.length;
    const out = new Array(n).fill(false);
    if (n < win) return out;
    const half = (win / 2) | 0;
    const t = new Float64Array(win);
    let tvar = 0;
    const meanT = (win - 1) / 2;
    for (let i = 0; i < win; i++) {
      t[i] = i - meanT;
      tvar += t[i] * t[i];
    }
    for (let s = 0; s <= n - win; s++) {
      let ok = true;
      let ymin = Infinity;
      let ymax = -Infinity;
      let my = 0;
      let mz = 0;
      for (let k = 0; k < win; k++) {
        const yy = y[s + k];
        const zz = z[s + k];
        if (!finite(yy) || !finite(zz)) {
          ok = false;
          break;
        }
        if (yy < ymin) ymin = yy;
        if (yy > ymax) ymax = yy;
        my += yy;
        mz += zz;
      }
      if (!ok) continue;
      my /= win;
      mz /= win;
      let by = 0;
      let bz = 0;
      for (let k = 0; k < win; k++) {
        by += (y[s + k] - my) * t[k];
        bz += (z[s + k] - mz) * t[k];
      }
      by /= tvar;
      bz /= tvar;
      let num = 0;
      let syy = 0;
      let szz = 0;
      for (let k = 0; k < win; k++) {
        const ry = y[s + k] - my - by * t[k];
        const rz = z[s + k] - mz - bz * t[k];
        num += ry * rz;
        syy += ry * ry;
        szz += rz * rz;
      }
      const den = Math.sqrt(syy * szz);
      const corr = den > 0 ? num / den : 0;
      const spread = Math.sqrt(syy / win);
      const tspread = Math.sqrt(szz / win);
      const hit =
        Math.abs(corr) >= 0.8 &&
        spread >= 0.004 &&
        spread <= 0.04 &&
        ymax - ymin <= 0.5 &&
        tspread >= 0.15;
      if (hit) out[s + half] = true;
    }
    return out;
  }

  function toKpa(arr) {
    const med = Math.abs(median(arr));
    if (finite(med) && med > 200) return arr.map((v) => (finite(v) ? v / 10 : v));
    return arr.slice();
  }

  function splitCsv(line, sep) {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) {
        if (ch === '"') {
          if (line[i + 1] === '"') {
            cur += '"';
            i += 1;
          } else q = false;
        } else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  }

  function parseCsv(text) {
    const raw = String(text).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = raw.split("\n").filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV 至少需要表头和一行数据。");
    const sep = lines[0].split(";").length > lines[0].split(",").length ? ";" : ",";
    const headers = splitCsv(lines[0], sep);
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = splitCsv(lines[i], sep);
      if (cells.every((c) => !c)) continue;
      const row = {};
      headers.forEach((h, k) => {
        row[h] = cells[k] == null ? "" : cells[k];
      });
      records.push(row);
    }
    return { headers, records };
  }

  function norm(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
  }

  function findCol(headers, keys, prefix) {
    const table = headers.map((h) => ({ h, n: norm(h) }));
    const p = prefix ? norm(prefix) : "";
    for (const key of keys) {
      const nk = norm(key);
      const exact = table.find((x) => x.n === nk);
      if (exact) return exact.h;
    }
    for (const key of keys) {
      const nk = norm(key);
      if (nk.length < 4) continue;
      const hit = table.find((x) => x.n.includes(nk) && (!p || x.n.startsWith(p)));
      if (hit) return hit.h;
    }
    return null;
  }

  function lysimeterIds(headers) {
    const ids = new Set();
    headers.forEach((h) => {
      const m = String(h).match(/L(\d+)\s*[-_ ]/i);
      if (m) ids.add(m[1]);
    });
    return [...ids].sort((a, b) => Number(a) - Number(b));
  }

  function num(v) {
    if (v == null || v === "") return NaN;
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }

  function parseTime(v) {
    if (v == null || v === "") return NaN;
    const s = String(v).trim().replace(/\//g, "-");
    const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return NaN;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0));
  }

  function clock(ms) {
    const d = new Date(ms);
    return {
      y: d.getUTCFullYear(),
      mo: d.getUTCMonth() + 1,
      d: d.getUTCDate(),
      h: d.getUTCHours(),
      mi: d.getUTCMinutes(),
      s: d.getUTCSeconds(),
    };
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmt(ms) {
    if (!finite(ms)) return "";
    const c = clock(ms);
    return c.y + "-" + pad(c.mo) + "-" + pad(c.d) + " " + pad(c.h) + ":" + pad(c.mi);
  }

  function dayKey(ms) {
    const c = clock(ms);
    return c.y + "-" + pad(c.mo) + "-" + pad(c.d);
  }

  function colSeries(records, headers, keys, prefix) {
    const name = findCol(headers, keys, prefix);
    if (!name) return { name: null, values: null };
    return { name, values: records.map((r) => num(r[name])) };
  }

  function holdLast(arr) {
    const out = arr.slice();
    let last = NaN;
    for (let i = 0; i < out.length; i++) {
      if (finite(out[i])) last = out[i];
      else out[i] = last;
    }
    return out;
  }

  function loadOne(records, headers, id) {
    const p = "L" + id + "-";
    const timeName = findCol(headers, ["timestamp", "datetime", "time", "时间", "日期时间"]);
    if (!timeName) throw new Error("找不到时间列。");
    const lywHit = colSeries(records, headers, [p + "LYW", "LYW", "蒸渗仪重量", "lysimeterweight"], p);
    if (!lywHit.name) throw new Error("找不到蒸渗仪重量（" + p + "LYW）。");
    const notes = [];
    const swwHit = colSeries(records, headers, [p + "SWW", "SWW", "储水瓶重量"], p);
    const swwAbsent = !swwHit.name;
    if (swwAbsent) notes.push("未找到储水瓶列。渗漏未测，日蒸散含未测排水，不给出闭合。");
    const time = records.map((r) => parseTime(r[timeName]));
    const order = time.map((t, i) => i).filter((i) => finite(time[i]));
    order.sort((a, b) => time[a] - time[b]);
    const take = (hit) => (hit && hit.values ? order.map((i) => hit.values[i]) : null);
    const mapped = ["时间 ← " + timeName, "蒸渗仪重量 ← " + lywHit.name];
    if (swwHit.name) mapped.push("储水瓶 ← " + swwHit.name);
    function takeNamed(keys) {
      const hit = colSeries(records, headers, keys, p);
      if (hit.name) mapped.push(hit.name);
      return take(hit);
    }
    const shared = (keys) => {
      const hit = colSeries(records, headers, keys, null);
      if (hit.name) mapped.push(hit.name);
      return take(hit);
    };
    const picked = {
      time: order.map((i) => time[i]),
      lyw: order.map((i) => lywHit.values[i]),
      sww: swwAbsent ? null : order.map((i) => swwHit.values[i]),
      swwAbsent,
      soc: shared(["Batt-SOC", "SOC", "电量"]),
      pumpIn: takeNamed([p + "Pump-in", "Pump-in", "泵入"]),
      pumpOut: takeNamed([p + "Pump-out", "Pump-out", "泵出"]),
      vtens: takeNamed([p + "VTENS-T4", "VTENS", "虚拟张力"]),
      ref: takeNamed([p + "REF-TENS-T4", p + "REF-Tens-T4", "REF-TENS"]),
      refill: takeNamed([p + "REF-Tens-Refill", "Refill", "补水"]),
      fieldTemp: takeNamed([p + "Field-Temp-T4", "FieldTemp"]),
      bottomTemp: takeNamed([p + "BottomTemp", "Bottom Temp", "底部温度"]),
      boxTemp: shared(["Field Box Temp", "Logger Box Temp"]),
    };
    ["Echo", "EC", "Temp", "MPS"].forEach((kind) => {
      for (let d = 1; d <= 3; d++) {
        picked[kind.toLowerCase() + d] = takeNamed([p + kind + "-T" + d]);
      }
    });
    if (picked.vtens) picked.vtens = toKpa(picked.vtens);
    if (picked.ref) picked.ref = toKpa(picked.ref);
    for (let d = 1; d <= 3; d++) {
      if (picked["mps" + d]) picked["mps" + d] = toKpa(picked["mps" + d]);
    }
    return { id, notes, mapped, ...picked };
  }

  function flagRuns(mask) {
    let c = 0;
    let first = -1;
    let last = -1;
    mask.forEach((v, i) => {
      if (!v) return;
      c += 1;
      if (first < 0) first = i;
      last = i;
    });
    return { count: c, first, last };
  }

  function analyze(records, headers, options) {
    options = options || {};
    const model = MODELS[options.model] || MODELS.SFL300;
    const biomassG = Number(options.biomassG) || 0;
    const ids = lysimeterIds(headers);
    const withWeight = ids.filter((cand) => findCol(headers, ["L" + cand + "-LYW"], "L" + cand + "-"));
    const id = options.lysimeter || withWeight[0] || ids[0] || "1";
    const w = loadOne(records, headers, id);
    const n = w.time.length;
    const notes = w.notes.slice();
    const gateKg = model.gateG / 1000;
    const scale = mmPerKg(model);
    const flags = {};
    const blank = () => new Array(n).fill(false);
    flags.missing_weight = w.lyw.map((v) => !finite(v));
    flags.irregular_step = blank();
    flags.gap_power = blank();
    for (let i = 1; i < n; i++) {
      const dt = w.time[i] - w.time[i - 1];
      if (dt > 90000) {
        const soc = w.soc ? w.soc[i] : NaN;
        if (finite(soc) && soc < 5) flags.gap_power[i] = true;
        else flags.irregular_step[i] = true;
      }
    }

    const med = rollingMedian(w.lyw, 11, 5, true);
    const resid = w.lyw.map((v, i) => (finite(v) && finite(med[i]) ? v - med[i] : NaN));
    const scaleMad = mad(resid);
    const spikeThr = Math.max(0.02, finite(scaleMad) ? 8 * scaleMad : 0.02);
    flags.spike = blank();
    for (let i = 1; i < n - 1; i++) {
      if (!finite(resid[i])) continue;
      const neighbors = Math.max(Math.abs(resid[i - 1]) || 0, Math.abs(resid[i + 1]) || 0);
      if (Math.abs(resid[i]) >= spikeThr && neighbors < 0.4 * Math.abs(resid[i])) flags.spike[i] = true;
    }

    const slow = rollingMedian(w.lyw, 5, 3, true);
    flags.step = blank();
    for (let i = 1; i < n; i++) {
      if (finite(slow[i]) && finite(slow[i - 1]) && Math.abs(slow[i] - slow[i - 1]) > 0.05) flags.step[i] = true;
    }
    flags.bottle_service = blank();
    if (w.sww) {
      const slowB = rollingMedian(w.sww, 5, 3, true);
      for (let i = 1; i < n; i++) {
        if (finite(slowB[i]) && finite(slowB[i - 1]) && Math.abs(slowB[i] - slowB[i - 1]) > 0.05) flags.bottle_service[i] = true;
      }
    }

    const d1 = w.lyw.map((v, i) => (i && finite(v) && finite(w.lyw[i - 1]) ? v - w.lyw[i - 1] : NaN));
    const osc = rollingStat(d1, 10, 8, "std");
    const drift = rollingStat(d1, 10, 8, "meanAbs");
    const peak = rollingStat(d1, 10, 8, "max");
    const windRaw = blank();
    for (let i = 0; i < n; i++) {
      windRaw[i] = finite(osc[i]) && osc[i] > 0.012 && drift[i] < 0.004 && peak[i] < 0.08;
    }
    flags.wind_vibration = blank();
    for (let i = 0; i < n; i++) {
      if (!windRaw[i]) continue;
      let c = 0;
      for (let j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) if (windRaw[j]) c += 1;
      flags.wind_vibration[i] = c >= 3;
    }
    for (let i = 0; i < n; i++) if (flags.wind_vibration[i]) flags.spike[i] = false;

    const temp = w.fieldTemp || w.bottomTemp || w.temp1;
    const finiteLyw = w.lyw.filter(finite).length;
    flags.wall_contact = temp && finiteLyw > 400 ? thermalWall(w.lyw, temp) : blank();

    flags.weight_nominal = w.lyw.map((v) => finite(v) && v > model.normalMax && v <= model.absMax);
    flags.weight_overload = w.lyw.map((v) => finite(v) && (v > model.absMax || v < 0));

    flags.soc_low = w.soc ? w.soc.map((v) => finite(v) && v < 25) : blank();
    flags.soc_sensor = w.soc ? w.soc.map((v) => finite(v) && v < 10) : blank();
    flags.soc_critical = w.soc ? w.soc.map((v) => finite(v) && v < 5) : blank();

    function anyDepth(prefix, test) {
      const hit = blank();
      for (let d = 1; d <= 3; d++) {
        const arr = w[prefix + d];
        if (!arr) continue;
        arr.forEach((v, i) => {
          if (test(v)) hit[i] = true;
        });
      }
      return hit;
    }
    flags.mps_sat = anyDepth("mps", (v) => finite(v) && v > -10);
    flags.mps_range = anyDepth("mps", (v) => finite(v) && v < -500);
    flags.vwc_range = anyDepth("echo", (v) => finite(v) && (v < 0 || v > 70));
    flags.ec_range = anyDepth("ec", (v) => finite(v) && (v < 0 || v > 23));
    flags.temp_range = anyDepth("temp", (v) => finite(v) && (v < -40 || v > 50));
    flags.field_temp_range = w.fieldTemp
      ? w.fieldTemp.map((v) => finite(v) && (v < -30 || v > 70))
      : blank();
    flags.tens_range = w.ref ? w.ref.map((v) => finite(v) && (v < -85 || v > 100)) : blank();

    flags.vtens_air = blank();
    flags.feedback_band = blank();
    flags.feedback_gap = blank();
    if (w.vtens) {
      w.vtens.forEach((v, i) => {
        let recent = 0;
        for (let k = Math.max(0, i - 30); k < i; k++) {
          if (finite(w.vtens[k])) recent = Math.max(recent, Math.abs(w.vtens[k]));
        }
        const near = finite(v) && Math.abs(v) >= 75;
        const collapsed = finite(v) && Math.abs(v) <= 5 && recent >= 50;
        flags.vtens_air[i] = near || collapsed;
        if (finite(v) && (v > 3 || v < -70) && !flags.vtens_air[i]) flags.feedback_band[i] = true;
      });
      if (w.ref) {
        for (let i = 0; i < n; i++) {
          const a = Math.max(0, i - 29);
          const diffs = [];
          for (let k = a; k <= i; k++) {
            if (finite(w.vtens[k]) && finite(w.ref[k]) && !flags.vtens_air[k]) diffs.push(Math.abs(w.vtens[k] - w.ref[k]));
          }
          if (diffs.length >= 10 && median(diffs) > 5) flags.feedback_gap[i] = true;
        }
      } else notes.push("未找到参比张力计，不能按 4.2 核对 VTENS 是否跟上现场。");
    } else notes.push("未找到 VTENS，不能判断 3.4 进气和 4.3 反馈区间。");
    if (!temp) notes.push("未找到温度列，不能判断 10.4.2.1 碰壁。");

    flags.pump_on = blank();
    for (let i = 0; i < n; i++) {
      const pin = w.pumpIn ? w.pumpIn[i] : 0;
      const pout = w.pumpOut ? w.pumpOut[i] : 0;
      flags.pump_on[i] = (finite(pin) ? pin : 0) + (finite(pout) ? pout : 0) > 0;
    }
    flags.tensiometer_refill = w.refill ? w.refill.map((v) => finite(v) && v >= 1) : blank();

    const lywC = withoutSteps(w.lyw);
    const swwHeld = w.sww ? holdLast(w.sww) : null;
    const swwC = swwHeld ? withoutSteps(swwHeld) : null;
    const sys = lywC.map((v, i) => {
      if (!finite(v)) return NaN;
      if (!swwC) return v;
      return finite(swwC[i]) ? v + swwC[i] : NaN;
    });
    const bins = new Map();
    for (let i = 0; i < n; i++) {
      const key = Math.floor(w.time[i] / 600000) * 600000;
      let b = bins.get(key);
      if (!b) {
        b = { t: key, sys: [], pumpMin: 0, wind: false, step: false, bottle: false };
        bins.set(key, b);
      }
      const drop = flags.spike[i] || flags.wind_vibration[i] || flags.pump_on[i];
      if (!drop && finite(sys[i])) b.sys.push(sys[i]);
      if (flags.pump_on[i]) b.pumpMin += 1;
      if (flags.wind_vibration[i]) b.wind = true;
      if (flags.step[i]) b.step = true;
      if (flags.bottle_service[i]) b.bottle = true;
    }
    const flux = [];
    let prev = null;
    let belowMm = 0;
    if (n) {
      const tStart = Math.floor(w.time[0] / 600000) * 600000;
      const tEnd = Math.floor(w.time[n - 1] / 600000) * 600000;
      const mean = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : NaN);
      for (let t = tStart; t <= tEnd; t += 600000) {
        const b = bins.get(t);
        const system = b ? mean(b.sys) : NaN;
        const adjacent = prev && t - prev.t === 600000;
        const delta = finite(system) && adjacent ? system - prev.system : NaN;
        if (finite(system)) prev = { t, system };
        else prev = null;
        if (!b || !b.sys.length) continue;
        const disturbed = b.wind || b.step || b.bottle;
        const gap = !finite(delta);
        let precip = 0;
        let loss = 0;
        if (!gap && !disturbed && delta >= gateKg) precip = delta * scale;
        if (!gap && !disturbed && delta < 0) loss = -delta * scale;
        if (!gap && !disturbed && delta > 0 && delta < gateKg) belowMm += delta * scale;
        flux.push({
          t,
          n: b.sys.length,
          deltaMm: finite(delta) ? delta * scale : null,
          precip,
          loss,
          pumpMin: b.pumpMin,
          wind: b.wind,
          step: b.step,
          bottle: b.bottle,
          gap,
        });
      }
    }

    const byDay = new Map();
    const wallDays = new Set();
    for (let i = 0; i < n; i++) {
      const key = dayKey(w.time[i]);
      if (flags.wall_contact[i]) wallDays.add(key);
      if (!finite(lywC[i]) || flags.spike[i] || flags.wind_vibration[i]) continue;
      const c = clock(w.time[i]);
      const sec = c.h * 3600 + c.mi * 60 + c.s;
      const row = {
        t: w.time[i],
        sec,
        lyw: lywC[i],
        sww: swwC && finite(swwC[i]) ? swwC[i] : NaN,
        swwOk: !w.swwAbsent && finite(w.sww[i]),
      };
      const cur = byDay.get(key);
      if (!cur) byDay.set(key, { midnight: sec <= 300 ? row : null, first: row });
      else {
        if (!cur.first || row.t < cur.first.t) cur.first = row;
        if (sec <= 300 && (!cur.midnight || row.t < cur.midnight.t)) cur.midnight = row;
      }
    }
    const days = [...byDay.keys()].sort();
    const daily = [];
    const biomassMm = (biomassG / 1000) * scale;
    const blocked = !!options.snow || !options.free;
    for (let i = 0; i < days.length - 1; i++) {
      const left = byDay.get(days[i]);
      const right = byDay.get(days[i + 1]);
      const a = left.midnight || left.first;
      const b = right.midnight || right.first;
      if (!a || !b) continue;
      const dLyw = b.lyw - a.lyw;
      const swwKnown = a.swwOk && b.swwOk && finite(a.sww) && finite(b.sww);
      const dSww = swwKnown ? b.sww - a.sww : null;
      const dSys = swwKnown ? dLyw + dSww : dLyw;
      const net = dSys * scale;
      const et = Math.max(-dSys, 0) * scale;
      const recharge = swwKnown ? Math.max(dSww, 0) * scale : null;
      const midnight = a.sec <= 300 && b.sec <= 300;
      let closure = midnight && swwKnown ? net - (recharge + dLyw * scale) : null;
      if (closure != null && Math.abs(closure) < 1e-6) closure = 0;
      daily.push({
        date: days[i],
        dSystemKg: dSys,
        dLywKg: dLyw,
        dSwwKg: dSww,
        net,
        et,
        recharge,
        closure,
        biomassMm,
        midnight,
        swwKnown,
        wall: wallDays.has(days[i]),
        official: midnight && swwKnown && !blocked,
      });
    }

    const flagRows = [];
    Object.keys(CLAUSES).forEach((code) => {
      if (!flags[code]) return;
      const hit = flagRuns(flags[code]);
      if (!hit.count) return;
      const meta = CLAUSES[code];
      flagRows.push({
        code,
        clause: meta[0],
        label: meta[1],
        why: meta[2],
        count: hit.count,
        first: fmt(w.time[hit.first]),
        last: fmt(w.time[hit.last]),
      });
    });

    const sensors = [];
    function pushSensor(name, arr, clause) {
      if (!arr) return;
      let bad = 0;
      arr.forEach((v) => {
        if (finite(v) && clause(v)) bad += 1;
      });
      const vals = arr.filter(finite);
      sensors.push({
        name,
        n: vals.length,
        bad,
        last: vals.length ? vals[vals.length - 1] : NaN,
      });
    }
    for (let d = 1; d <= 3; d++) {
      pushSensor("含水量 T" + d + " %", w["echo" + d], (v) => v < 0 || v > 70);
      pushSensor("电导率 T" + d + " mS/cm", w["ec" + d], (v) => v < 0 || v > 23);
      pushSensor("土温 T" + d + " ℃", w["temp" + d], (v) => v < -40 || v > 50);
      pushSensor("MPS T" + d + " kPa", w["mps" + d], (v) => v > -10 || v < -500);
    }
    pushSensor("VTENS kPa", w.vtens, (v) => Math.abs(v) >= 75 || v > 3 || v < -70);
    pushSensor("参比张力 kPa", w.ref, (v) => v < -85 || v > 100);

    notes.unshift(model.label + "。" + model.areaNote + "。1 kg = " + scale.toFixed(2) + " mm。");
    notes.push(
      "降水门限 " +
        model.gateG +
        " g = " +
        (gateKg * scale).toFixed(3) +
        " mm。手册把 5 g 写成 0.035 mm，与 0.0707 m² 不符，SFL300 采用 5 g。"
    );
    notes.push("10 分钟过门限增重才记降水（10.3.1）。正式蒸散只累计两端都落在午夜 5 分钟内、且储水瓶有实测的日子（10.3.2）。空箱不做差，减重不过降水门限。");
    notes.push("生物量 " + biomassG + " g/日单独列出，不从正式蒸散扣除。");
    if (flagRuns(flags.wall_contact).count) notes.push("碰壁只标记，未从蒸散剔除（10.4.2.1）。");
    notes.push("本机通道没有辐射和风速，不算 Et0（10.3.3）。");
    notes.push("AWAT / snap 的公式在处理笔记里是图，这一版不做过滤前后对比。");
    if (options.snow) notes.push("已勾选积雪或边缘植物（10.4.2.2），这些日子不进正式蒸散。");
    if (options.free) notes.push("已确认筒体和储水瓶可自由活动（10.2）。");
    else notes.push("尚未确认自由度（10.2），正式午夜蒸散不汇总。");

    const sum = (arr, key) => arr.reduce((s, v) => s + (finite(v[key]) ? v[key] : 0), 0);
    const officialDays = daily.filter((r) => r.official);
    return {
      model,
      id,
      ids: ids.length ? ids : [id],
      notes,
      mapped: w.mapped,
      start: fmt(w.time[0]),
      end: fmt(w.time[n - 1]),
      rows: n,
      summary: {
        precipMm: sum(flux, "precip"),
        lossMm: sum(flux, "loss"),
        officialEtMm: officialDays.length && !blocked ? sum(officialDays, "et") : null,
        officialNote: options.snow ? "已勾选积雪，未汇总" : options.free ? "正式午夜蒸散 mm" : "未确认自由度",
        netMm: sum(daily.filter((r) => r.midnight), "net"),
        belowMm,
        rechargeMm: officialDays.length ? sum(officialDays, "recharge") : null,
        biomassMm,
      },
      flagRows,
      flags,
      daily,
      flux,
      sensors,
      series: {
        time: w.time,
        lyw: w.lyw,
        lywC,
        sww: w.sww || lywC.map(() => NaN),
        vtens: w.vtens,
        ref: w.ref,
      },
    };
  }

  function demoRecords() {
    const rng = mulberry32(7);
    const n = 72 * 60;
    const t0 = Date.UTC(2024, 6, 1, 0, 0, 0);
    const model = MODELS.SFL300;
    const etPerMin = 2 / mmPerKg(model) / (24 * 60);
    const lyw = new Array(n);
    const sww = new Array(n);
    lyw[0] = 42;
    sww[0] = 1.2;
    for (let i = 1; i < n; i++) {
      const dt = new Date(t0 + i * 60000);
      const hour = dt.getUTCHours() + dt.getUTCMinutes() / 60;
      lyw[i] = lyw[i - 1] - etPerMin;
      sww[i] = sww[i - 1];
      if (dt.getUTCDate() === 1 && hour >= 14 && hour < 14.5) lyw[i] += 0.04;
      if (dt.getUTCDate() === 2 && hour >= 9) {
        sww[i] += 0.0004;
        lyw[i] -= 0.0004;
      }
    }
    lyw[300] += 0.35;
    for (let i = 800; i < 810; i++) lyw[i] = NaN;
    for (let i = 1500; i < n; i++) lyw[i] += 0.08;
    for (let i = 0; i < n; i++) if (finite(lyw[i])) lyw[i] += normal(rng) * 0.002;
    for (let i = 120; i < 180; i++) lyw[i] += normal(rng) * 0.02;
    const temp = new Array(n);
    for (let i = 0; i < n; i++) temp[i] = 18 + 6 * Math.sin((2 * Math.PI * i) / 1440);
    const amp = new Array(n).fill(0);
    const a0 = 1500;
    const a1 = 2700;
    const edge = 180;
    for (let i = a0; i < a1; i++) amp[i] = 1;
    for (let i = 0; i < edge; i++) {
      amp[a0 + i] *= i / edge;
      amp[a1 - edge + i] *= (edge - i) / edge;
    }
    let tmean = 0;
    for (let i = a0; i < a1; i++) tmean += temp[i];
    tmean /= a1 - a0;
    for (let i = 0; i < n; i++) lyw[i] += amp[i] * 0.012 * (temp[i] - tmean);
    for (let i = 3200; i < n; i++) sww[i] -= 0.25;
    const soc = new Array(n);
    const vtens = new Array(n).fill(-18);
    const ref = new Array(n);
    const mps = new Array(n).fill(-40);
    const ec = new Array(n).fill(0.35);
    const echo = new Array(n);
    const refill = new Array(n).fill(0);
    const pump = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      soc[i] = 80 + ((4 - 80) * i) / (n - 1);
      ref[i] = -18 + 3 * Math.sin((2 * Math.PI * i) / 1440);
      vtens[i] = ref[i];
      echo[i] = 28 + (0.01 * i) / 60;
    }
    for (let i = 400; i < 460; i++) vtens[i] = ref[i] - 12;
    for (let i = 0; i < 60; i++) vtens[2500 + i] = -18 + ((-82 - -18) * i) / 59;
    for (let i = 2560; i < 2620; i++) vtens[i] = 0;
    for (let i = 600; i < 700; i++) mps[i] = -4;
    ec[900] = 28;
    for (let i = 1200; i < 1260; i++) refill[i] = 1;
    for (let i = 2000; i < 2003; i++) pump[i] = 15;
    const headers = [
      "timestamp",
      "L1-LYW",
      "L1-SWW",
      "Batt-SOC",
      "L1-Temp-T1",
      "L1-Echo-T1",
      "L1-EC-T1",
      "L1-MPS-T1",
      "L1-VTENS-T4",
      "L1-REF-TENS-T4",
      "L1-REF-Tens-Refill",
      "L1-Pump-in",
      "L1-Pump-out",
    ];
    const records = [];
    for (let i = 0; i < n; i++) {
      records.push({
        timestamp: fmt(t0 + i * 60000) + ":00",
        "L1-LYW": finite(lyw[i]) ? lyw[i].toFixed(4) : "",
        "L1-SWW": sww[i].toFixed(4),
        "Batt-SOC": soc[i].toFixed(2),
        "L1-Temp-T1": temp[i].toFixed(2),
        "L1-Echo-T1": echo[i].toFixed(2),
        "L1-EC-T1": ec[i].toFixed(2),
        "L1-MPS-T1": mps[i].toFixed(2),
        "L1-VTENS-T4": vtens[i].toFixed(2),
        "L1-REF-TENS-T4": ref[i].toFixed(2),
        "L1-REF-Tens-Refill": String(refill[i]),
        "L1-Pump-in": String(pump[i]),
        "L1-Pump-out": "0",
      });
    }
    return { headers, records };
  }

  function csvText(result) {
    const lines = ["time,n,delta_mm,precip_mm,loss_mm,pump_min,wind,step,bottle,gap"];
    result.flux.forEach((r) => {
      lines.push(
        [
          fmt(r.t),
          r.n,
          r.deltaMm == null ? "" : r.deltaMm.toFixed(4),
          r.precip.toFixed(4),
          r.loss.toFixed(4),
          r.pumpMin,
          r.wind ? 1 : 0,
          r.step ? 1 : 0,
          r.bottle ? 1 : 0,
          r.gap ? 1 : 0,
        ].join(",")
      );
    });
    return lines.join("\n");
  }

  function dailyText(result) {
    const lines = ["date,d_system_kg,net_mm,et_mm,recharge_mm,closure_mm,biomass_mm,midnight,sww_known,wall,official"];
    result.daily.forEach((r) => {
      const cell = (v, d) => (v == null || !finite(v) ? "" : v.toFixed(d));
      lines.push(
        [
          r.date,
          r.dSystemKg.toFixed(4),
          r.net.toFixed(3),
          r.et.toFixed(3),
          cell(r.recharge, 3),
          cell(r.closure, 3),
          r.biomassMm.toFixed(3),
          r.midnight ? 1 : 0,
          r.swwKnown ? 1 : 0,
          r.wall ? 1 : 0,
          r.official ? 1 : 0,
        ].join(",")
      );
    });
    return lines.join("\n");
  }

  function runsOf(time, mask) {
    const spans = [];
    let start = -1;
    for (let i = 0; i < mask.length; i++) {
      if (mask[i] && start < 0) start = i;
      if (start >= 0 && (!mask[i] || i === mask.length - 1)) {
        const end = mask[i] ? i : i - 1;
        spans.push([time[start], time[end]]);
        start = -1;
      }
    }
    return spans;
  }

  function chartSvg(title, series, bands, points, y2) {
    const W = 800;
    const H = 280;
    const L = 52;
    const R = y2 ? 52 : 16;
    const T = 28;
    const B = 32;
    const t0 = series[0].t[0];
    const t1 = series[0].t[series[0].t.length - 1];
    const xOf = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - R);
    function extent(arr) {
      let lo = Infinity;
      let hi = -Infinity;
      arr.forEach((v) => {
        if (!finite(v)) return;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      });
      if (!finite(lo)) return [0, 1];
      const pad = (hi - lo) * 0.08 || 1;
      return [lo - pad, hi + pad];
    }
    const y1 = extent(series[0].y);
    const yOf = (v) => T + ((y1[1] - v) / (y1[1] - y1[0] || 1)) * (H - T - B);
    let y2ext = null;
    let y2Of = null;
    if (y2) {
      y2ext = extent(y2.y);
      y2Of = (v) => T + ((y2ext[1] - v) / (y2ext[1] - y2ext[0] || 1)) * (H - T - B);
    }
    const parts = [];
    parts.push('<svg viewBox="0 0 ' + W + " " + H + '" role="img">');
    parts.push("<title>" + title + "</title>");
    parts.push('<text x="' + L + '" y="18" font-size="13">' + title + "</text>");
    bands.forEach((b) => {
      const x1 = xOf(b[0]);
      const x2 = Math.max(xOf(b[1]), x1 + 1.5);
      parts.push('<rect x="' + x1 + '" y="' + T + '" width="' + (x2 - x1) + '" height="' + (H - T - B) + '" fill="' + b[2] + '" opacity="0.22"></rect>');
    });
    function poly(s, yfn, color) {
      let d = "";
      let pen = false;
      const step = Math.max(1, Math.floor(s.t.length / 700));
      for (let i = 0; i < s.t.length; i += step) {
        if (!finite(s.y[i])) {
          pen = false;
          continue;
        }
        d += (pen ? "L" : "M") + xOf(s.t[i]).toFixed(1) + " " + yfn(s.y[i]).toFixed(1) + " ";
        pen = true;
      }
      parts.push('<path d="' + d.trim() + '" fill="none" stroke="' + color + '" stroke-width="1.4"></path>');
    }
    series.forEach((s) => poly(s, yOf, s.color));
    if (y2) poly(y2, y2Of, y2.color);
    points.forEach((p) => {
      if (!finite(p.y)) return;
      parts.push('<circle cx="' + xOf(p.t).toFixed(1) + '" cy="' + yOf(p.y).toFixed(1) + '" r="2.4" fill="' + p.color + '"></circle>');
    });
    parts.push('<text x="8" y="' + (T + 12) + '" font-size="11">' + y1[1].toFixed(1) + "</text>");
    parts.push('<text x="8" y="' + (H - B) + '" font-size="11">' + y1[0].toFixed(1) + "</text>");
    if (y2ext) {
      parts.push('<text x="' + (W - 46) + '" y="' + (T + 12) + '" font-size="11">' + y2ext[1].toFixed(2) + "</text>");
      parts.push('<text x="' + (W - 46) + '" y="' + (H - B) + '" font-size="11">' + y2ext[0].toFixed(2) + "</text>");
    }
    parts.push('<text x="' + L + '" y="' + (H - 8) + '" font-size="11">' + fmt(t0).slice(5) + "</text>");
    parts.push('<text x="' + (W - R - 70) + '" y="' + (H - 8) + '" font-size="11">' + fmt(t1).slice(5) + "</text>");
    parts.push("</svg>");
    return parts.join("");
  }

  function fluxSvg(flux) {
    const W = 800;
    const H = 240;
    if (!flux.length) return "";
    let max = 1;
    flux.forEach((r) => {
      max = Math.max(max, r.precip, r.loss);
    });
    const L = 40;
    const T = 24;
    const B = 28;
    const t0 = flux[0].t;
    const t1 = flux[flux.length - 1].t;
    const xOf = (t) => L + ((t - t0) / (t1 - t0 || 1)) * (W - L - 12);
    const mid = T + (H - T - B) / 2;
    const yOf = (v) => mid - (v / max) * ((H - T - B) / 2 - 4);
    const parts = ['<svg viewBox="0 0 ' + W + " " + H + '" role="img"><title>10 分钟通量</title>'];
    parts.push('<text x="' + L + '" y="16" font-size="13">10 分钟通量：向上为降水（过门限），向下为减重</text>');
    parts.push('<line x1="' + L + '" y1="' + mid + '" x2="' + (W - 12) + '" y2="' + mid + '" stroke="#8a8175" stroke-width="1"></line>');
    const bw = Math.max(1.2, ((W - L - 12) / flux.length) * 0.8);
    flux.forEach((r) => {
      const x = xOf(r.t);
      if (r.precip > 0) parts.push('<rect x="' + x + '" y="' + yOf(r.precip) + '" width="' + bw + '" height="' + (mid - yOf(r.precip)) + '" fill="#2f6f4e"></rect>');
      if (r.loss > 0) parts.push('<rect x="' + x + '" y="' + mid + '" width="' + bw + '" height="' + (yOf(-r.loss) - mid) + '" fill="#a15c38"></rect>');
    });
    parts.push('<text x="6" y="' + (T + 8) + '" font-size="11">' + max.toFixed(1) + "</text>");
    parts.push('<text x="6" y="' + (H - B) + '" font-size="11">-' + max.toFixed(1) + "</text>");
    parts.push("</svg>");
    return parts.join("");
  }

  function table(rows, cols) {
    const head = "<tr>" + cols.map((c) => "<th>" + c[0] + "</th>").join("") + "</tr>";
    const body = rows
      .map((r) => "<tr>" + cols.map((c) => "<td>" + c[1](r) + "</td>").join("") + "</tr>")
      .join("");
    return "<table>" + head + body + "</table>";
  }

  function render(result, els) {
    const s = result.summary;
    const numCard = (v) => (v == null || !finite(v) ? "—" : v.toFixed(2));
    const cards = [
      ["记录", result.rows],
      ["10 分钟过门限增重 mm", s.precipMm.toFixed(2)],
      ["10 分钟减重 mm", s.lossMm.toFixed(2)],
      [s.officialNote, numCard(s.officialEtMm)],
      ["午夜系统净变化 mm", numCard(s.netMm)],
      ["正式日渗漏 mm", numCard(s.rechargeMm)],
      ["低于门限的增重 mm", s.belowMm.toFixed(2)],
      ["生物量 mm/日（未扣除）", s.biomassMm.toFixed(2)],
    ];
    els.cards.innerHTML = cards
      .map((c) => '<article class="card"><b>' + c[1] + "</b><span>" + c[0] + "</span></article>")
      .join("");
    els.meta.textContent = result.start + " — " + result.end + " · 蒸渗仪 L" + result.id;
    els.notes.innerHTML = result.notes.map((n) => "<li>" + n + "</li>").join("");
    const time = result.series.time;
    const bands = []
      .concat(runsOf(time, result.flags.wind_vibration).map((r) => r.concat("#5b7c99")))
      .concat(runsOf(time, result.flags.wall_contact).map((r) => r.concat("#6b4c7a")))
      .concat(runsOf(time, result.flags.step).map((r) => r.concat("#c46b2c")))
      .concat(runsOf(time, result.flags.vtens_air).map((r) => r.concat("#b45309")));
    const points = [];
    result.flags.spike.forEach((v, i) => {
      if (v) points.push({ t: time[i], y: result.series.lyw[i], color: "#9a3412" });
    });
    els.weight.innerHTML = chartSvg(
      "重量：灰为原始称重，绿为扣除持续台阶后；右轴为储水瓶",
      [
        { t: time, y: result.series.lyw, color: "#8a8175" },
        { t: time, y: result.series.lywC, color: "#2f6f4e" },
      ],
      bands,
      points,
      { t: time, y: result.series.sww, color: "#8a5a44" }
    );
    els.flux.innerHTML = fluxSvg(result.flux);
    if (result.series.vtens) {
      const tension = [{ t: time, y: result.series.vtens, color: "#9a3412" }];
      if (result.series.ref) tension.push({ t: time, y: result.series.ref, color: "#245b78" });
      els.tension.innerHTML = chartSvg("底部反馈：红 VTENS，蓝参比张力（kPa）", tension, runsOf(time, result.flags.vtens_air).map((r) => r.concat("#b45309")), [], null);
    } else els.tension.innerHTML = "";
    els.flags.innerHTML = table(result.flagRows, [
      ["条款", (r) => r.clause],
      ["项目", (r) => r.label],
      ["依据", (r) => r.why],
      ["次数", (r) => r.count],
      ["最早", (r) => r.first],
      ["最晚", (r) => r.last],
    ]);
    const mm = (v, d) => (v == null || !finite(v) ? "—" : v.toFixed(d));
    els.daily.innerHTML = table(result.daily, [
      ["日期", (r) => r.date],
      ["系统差 kg", (r) => r.dSystemKg.toFixed(3)],
      ["系统净变化 mm", (r) => r.net.toFixed(2)],
      ["蒸散 mm", (r) => r.et.toFixed(2)],
      ["渗漏 mm", (r) => mm(r.recharge, 2)],
      ["闭合 mm", (r) => mm(r.closure, 3)],
      ["午夜", (r) => (r.midnight ? "是" : "用日初")],
      ["碰壁", (r) => (r.wall ? "未从蒸散剔除" : "")],
      ["正式", (r) => (r.official ? "是" : "否")],
    ]);
    const shown = result.sensors.filter((r) => r.n);
    els.sensors.innerHTML = shown.length
      ? table(shown, [
          ["通道", (r) => r.name],
          ["有效值", (r) => r.n],
          ["超量程", (r) => r.bad],
          ["末值", (r) => (finite(r.last) ? r.last.toFixed(2) : "")],
        ])
      : "";
    els.exportFlux.href = URL.createObjectURL(new Blob([csvText(result)], { type: "text/csv" }));
    els.exportDaily.href = URL.createObjectURL(new Blob([dailyText(result)], { type: "text/csv" }));
  }

  function mount(doc) {
    const $ = (id) => doc.getElementById(id);
    const els = {
      cards: $("cards"),
      meta: $("meta"),
      notes: $("notes"),
      weight: $("weight"),
      flux: $("flux"),
      tension: $("tension"),
      flags: $("flags"),
      daily: $("daily"),
      sensors: $("sensors"),
      exportFlux: $("export-flux"),
      exportDaily: $("export-daily"),
      status: $("status"),
      lys: $("lys"),
    };
    let last = null;
    function options() {
      return {
        model: $("model").value,
        biomassG: Number($("biomass").value) || 0,
        snow: $("snow").checked,
        free: $("free").checked,
        lysimeter: els.lys.value || undefined,
      };
    }
    function show(records, headers) {
      const ids = lysimeterIds(headers).filter((cand) =>
        headers.some((h) => norm(h) === norm("L" + cand + "-LYW"))
      );
      const list = ids.length ? ids : ["1"];
      const prev = els.lys.value;
      els.lys.innerHTML = list.map((id) => '<option value="' + id + '">L' + id + "</option>").join("");
      if (list.indexOf(prev) >= 0) els.lys.value = prev;
      const wrap = doc.getElementById("lys-wrap");
      if (wrap) wrap.hidden = list.length < 2;
      last = { records, headers };
      const result = analyze(records, headers, options());
      render(result, els);
      els.status.textContent = "完成";
    }
    $("demo").addEventListener("click", () => {
      els.status.textContent = "正在计算示例…";
      const demo = demoRecords();
      setTimeout(() => show(demo.records, demo.headers), 30);
    });
    $("run").addEventListener("click", () => {
      const file = $("file").files[0];
      if (!file) {
        els.status.textContent = "请先选择 CSV。";
        return;
      }
      if (file.size > 40 * 1024 * 1024) {
        els.status.textContent = "文件超过 40 MB。";
        return;
      }
      els.status.textContent = "正在读取…";
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = parseCsv(String(reader.result));
          show(parsed.records, parsed.headers);
        } catch (err) {
          els.status.textContent = err.message || "无法解析这个 CSV。";
        }
      };
      reader.readAsText(file);
    });
    ["model", "biomass", "snow", "free", "lys"].forEach((id) => {
      $(id).addEventListener("change", () => {
        if (!last) return;
        show(last.records, last.headers);
      });
    });
  }

  return { MODELS, parseCsv, analyze, demoRecords, csvText, mount };
});
