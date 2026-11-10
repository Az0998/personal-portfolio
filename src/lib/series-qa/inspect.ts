/** Local time-series QA. Nothing leaves the browser. */

export type IssueKind = "空值" | "非数字" | "重复时刻" | "时间倒序" | "缺测间隔" | "负值" | "尖峰";

export type QaIssue = {
  row: number;
  time: string;
  kind: IssueKind;
  detail: string;
};

export type QaPoint = {
  row: number;
  time: string;
  epoch: number | null;
  value: number | null;
  flags: IssueKind[];
};

export type QaReport = {
  delimiter: string;
  headers: string[];
  timeCol: number;
  valueCol: number;
  timeName: string;
  valueName: string;
  points: QaPoint[];
  issues: QaIssue[];
  counts: Record<IssueKind, number>;
};

const KINDS: IssueKind[] = ["空值", "非数字", "重复时刻", "时间倒序", "缺测间隔", "负值", "尖峰"];

export const SAMPLE_CSV = `time,q_m3s
2024-06-01 00:00,12.1
2024-06-01 01:00,12.4
2024-06-01 02:00,11.8
2024-06-01 02:00,11.9
2024-06-01 01:30,12.0
2024-06-01 04:00,13.2
2024-06-01 05:00,-2
2024-06-01 06:00,12.6
2024-06-01 07:00,80
2024-06-01 08:00,13.1
2024-06-01 09:00,
2024-06-01 10:00,abc
2024-06-01 11:00,12.8
2024-06-01 12:00,13.0`;

function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function detectDelimiter(header: string): string {
  const tabs = (header.match(/\t/g) || []).length;
  const commas = (header.match(/,/g) || []).length;
  const semis = (header.match(/;/g) || []).length;
  if (tabs > commas && tabs >= semis) return "\t";
  if (semis > commas) return ";";
  return ",";
}

function looksLikeTime(cell: string): boolean {
  if (!cell || !/\d/.test(cell)) return false;
  const t = Date.parse(cell.includes("T") ? cell : cell.replace(" ", "T"));
  return Number.isFinite(t);
}

function looksLikeNumber(cell: string): boolean {
  if (!cell) return false;
  return Number.isFinite(Number(cell));
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function inspectCsv(raw: string): QaReport | null {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) return null;
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter));
  const width = headers.length;

  let timeCol = 0;
  let bestTime = -1;
  for (let c = 0; c < width; c++) {
    const sample = rows.slice(0, 12).map((r) => r[c] ?? "");
    const hits = sample.filter(looksLikeTime).length;
    if (hits > bestTime) {
      bestTime = hits;
      timeCol = c;
    }
  }
  let valueCol = timeCol === 0 && width > 1 ? 1 : 0;
  let bestNum = -1;
  for (let c = 0; c < width; c++) {
    if (c === timeCol) continue;
    const sample = rows.slice(0, 12).map((r) => r[c] ?? "");
    const hits = sample.filter(looksLikeNumber).length;
    if (hits > bestNum) {
      bestNum = hits;
      valueCol = c;
    }
  }

  const points: QaPoint[] = rows.map((cells, i) => {
    const time = cells[timeCol] ?? "";
    const rawV = cells[valueCol] ?? "";
    const parsed = time ? Date.parse(time.includes("T") ? time : time.replace(" ", "T")) : NaN;
    const epoch = Number.isFinite(parsed) ? parsed : null;
    const value = rawV === "" ? null : Number.isFinite(Number(rawV)) ? Number(rawV) : null;
    const flags: IssueKind[] = [];
    if (rawV === "") flags.push("空值");
    else if (value === null) flags.push("非数字");
    if (value !== null && value < 0) flags.push("负值");
    return { row: i + 2, time, epoch, value, flags };
  });

  const seen = new Map<number, number>();
  for (const p of points) {
    if (p.epoch == null) continue;
    const prev = seen.get(p.epoch);
    if (prev != null) p.flags.push("重复时刻");
    else seen.set(p.epoch, p.row);
  }

  let lastEpoch: number | null = null;
  for (const p of points) {
    if (p.epoch == null) continue;
    if (lastEpoch != null && p.epoch < lastEpoch) p.flags.push("时间倒序");
    lastEpoch = p.epoch;
  }

  const ordered = points
    .filter((p) => p.epoch != null && p.value != null && !p.flags.includes("重复时刻"))
    .slice()
    .sort((a, b) => (a.epoch! - b.epoch!));

  const deltas: number[] = [];
  for (let i = 1; i < ordered.length; i++) deltas.push(ordered[i].epoch! - ordered[i - 1].epoch!);
  const step = median(deltas.filter((d) => d > 0));
  if (step > 0 && deltas.length >= 4) {
    for (let i = 1; i < ordered.length; i++) {
      const gap = ordered[i].epoch! - ordered[i - 1].epoch!;
      if (gap > step * 1.8) {
        ordered[i].flags.push("缺测间隔");
      }
    }
  }

  const jumps: number[] = [];
  for (let i = 1; i < ordered.length; i++) jumps.push(Math.abs(ordered[i].value! - ordered[i - 1].value!));
  const scale = median(jumps);
  if (scale > 0) {
    for (let i = 1; i < ordered.length - 1; i++) {
      const left = Math.abs(ordered[i].value! - ordered[i - 1].value!);
      const right = Math.abs(ordered[i].value! - ordered[i + 1].value!);
      const extreme =
        (ordered[i].value! - ordered[i - 1].value!) * (ordered[i].value! - ordered[i + 1].value!) > 0;
      if (extreme && left > scale * 4 && right > scale * 4) ordered[i].flags.push("尖峰");
    }
  }

  const issues: QaIssue[] = [];
  for (const p of points) {
    for (const kind of p.flags) {
      issues.push({
        row: p.row,
        time: p.time,
        kind,
        detail: detailFor(kind, p, step),
      });
    }
  }

  const counts = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<IssueKind, number>;
  for (const issue of issues) counts[issue.kind] += 1;

  return {
    delimiter,
    headers,
    timeCol,
    valueCol,
    timeName: headers[timeCol] || `列${timeCol + 1}`,
    valueName: headers[valueCol] || `列${valueCol + 1}`,
    points,
    issues,
    counts,
  };
}

function detailFor(kind: IssueKind, p: QaPoint, step: number): string {
  if (kind === "缺测间隔" && step > 0) {
    const hours = step / 36e5;
    return `与上一有效点间隔超过常见步长（约 ${hours >= 1 ? hours.toFixed(1) + " h" : Math.round(step / 6e4) + " min"}）的 1.8 倍`;
  }
  if (kind === "尖峰") return "相对两侧邻点都跳得过大，且是局部极值";
  if (kind === "负值") return `数值 ${p.value}`;
  if (kind === "重复时刻") return "同一时刻出现多于一次";
  if (kind === "时间倒序") return "这一行的时刻早于上一行";
  if (kind === "空值") return "数值单元格为空";
  return "数值单元格无法转成数字";
}

export function issuesToCsv(report: QaReport): string {
  const lines = ["row,time,kind,detail"];
  for (const i of report.issues) {
    lines.push([i.row, csvCell(i.time), i.kind, csvCell(i.detail)].join(","));
  }
  return lines.join("\n");
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
