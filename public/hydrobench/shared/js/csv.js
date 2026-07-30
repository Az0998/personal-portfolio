/** CSV / 简易表格文本解析 */
(function (global) {
  function splitLine(line, delim) {
    const out = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === delim && !inQ) {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    out.push(cur);
    return out;
  }

  function detectDelim(text) {
    const sample = text.split(/\r?\n/).slice(0, 5).join("\n");
    const counts = [
      [",", (sample.match(/,/g) || []).length],
      ["\t", (sample.match(/\t/g) || []).length],
      [";", (sample.match(/;/g) || []).length],
    ];
    counts.sort((a, b) => b[1] - a[1]);
    return counts[0][1] > 0 ? counts[0][0] : ",";
  }

  function parseCSV(text, opts) {
    opts = opts || {};
    const delim = opts.delim || detectDelim(text);
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
    if (!lines.length) return { headers: [], rows: [], delim };
    let headers;
    let start = 0;
    if (opts.hasHeader !== false) {
      headers = splitLine(lines[0], delim).map((h) => h.trim());
      start = 1;
    } else {
      const n = splitLine(lines[0], delim).length;
      headers = Array.from({ length: n }, (_, i) => "col" + (i + 1));
    }
    const rows = [];
    for (let i = start; i < lines.length; i++) {
      const cells = splitLine(lines[i], delim);
      const obj = {};
      headers.forEach((h, j) => {
        obj[h] = (cells[j] != null ? cells[j] : "").trim();
      });
      rows.push(obj);
    }
    return { headers, rows, delim };
  }

  function toCSV(headers, rows, delim) {
    delim = delim || ",";
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };
    const lines = [headers.map(esc).join(delim)];
    rows.forEach((r) => {
      lines.push(headers.map((h) => esc(r[h])).join(delim));
    });
    return lines.join("\n");
  }

  global.HydroCSV = { parseCSV, toCSV, detectDelim, splitLine };
})(typeof window !== "undefined" ? window : globalThis);
