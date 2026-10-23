import json
import urllib.request
from pathlib import Path

def req(method, url, data=None, headers=None):
    h = headers or {}
    body = data
    if isinstance(data, dict):
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=body, method=method, headers=h)
    with urllib.request.urlopen(r, timeout=180) as resp:
        return json.loads(resp.read().decode())


def yrange(series, key):
    ys = [v for v in (series.get("series") or {}).get(key, []) if isinstance(v, (int, float))]
    return (min(ys), max(ys), max(ys) - min(ys)) if ys else None


def main():
    base = "http://127.0.0.1:8080"
    issues = []
    demo = req("POST", base + "/api/sessions/demo?kind=matlab")
    sid = demo["id"]
    keep = ["id", "weightRows", "probeRows", "weatherRows", "weightError", "weightSuspect", "gateMm", "demoKind", "totals", "simTruth"]
    print("DEMO", json.dumps({k: demo.get(k) for k in keep}, ensure_ascii=False, indent=2))
    if demo.get("weightRows", 0) <= 0:
        issues.append("demo weight empty")
    if demo.get("probeRows", 0) <= 0:
        issues.append("demo probe empty")
    if demo.get("weatherRows", 0) <= 0:
        issues.append("demo weather empty")
    if abs(float(demo.get("gateMm", 0)) - 0.071) > 0.005:
        issues.append("gate not 0.071")
    if not demo.get("simTruth"):
        issues.append("missing simTruth")

    w = req("GET", f"{base}/api/sessions/{sid}/series?group=weight&maxPoints=2400")
    p = req("GET", f"{base}/api/sessions/{sid}/series?group=probe&maxPoints=2000")
    wx = req("GET", f"{base}/api/sessions/{sid}/series?group=weather&maxPoints=2000")
    print("WEIGHT n", w.get("n"), "marks", len(w.get("marks") or []), "pumpEvents", len(w.get("pumpEvents") or []))
    print("PROBE n", p.get("n"), "marks", len(p.get("marks") or []), "keys", list((p.get("series") or {}).keys()))
    print("WEATHER n", wx.get("n"))
    print("lywAnomMm", yrange(w, "lywAnomMm"))
    print("lyw", yrange(w, "lyw"))
    print("echo1", yrange(p, "echo1"))
    print("echo3", yrange(p, "echo3"))
    an = yrange(w, "lywAnomMm")
    if not an or an[2] < 1:
        issues.append(f"anomaly range too small {an}")
    pe = w.get("pumpEvents") or []
    print("pump count", len(pe), "sample", pe[:2])
    if not pe:
        issues.append("demo pump events empty")

    fw = req("GET", f"{base}/api/sessions/{sid}/flags/summary?stream=weight")
    fp = req("GET", f"{base}/api/sessions/{sid}/flags/summary?stream=probe")
    print("FLAG weight", json.dumps(fw, ensure_ascii=False)[:900])
    print("FLAG probe", json.dumps(fp, ensure_ascii=False)[:900])

    temp = req("GET", f"{base}/api/sessions/{sid}/temp")
    print("TEMP", [{k: L.get(k) for k in ["layer", "label", "alpha", "daysUsed"]} for L in temp.get("layers") or []])
    bal = req("GET", f"{base}/api/sessions/{sid}/balance")
    tot = bal.get("totals") or {}
    print("BALANCE", json.dumps(tot, ensure_ascii=False), "daily", len(bal.get("daily") or []))
    if not (bal.get("daily") or []):
        issues.append("daily table empty")
    if float(tot.get("precipMm") or 0) <= 0:
        issues.append("P=0 on rainy sim")
    cmp = req("GET", f"{base}/api/sessions/{sid}/filters/compare")
    print("FILTER stats", cmp.get("stats"))
    rep = req("GET", f"{base}/api/sessions/{sid}/report")
    print("REPORT keys", list(rep.keys()))

    boundary = "----SflQaBoundary"
    files = {
        "weight": Path(r"d:\deep-learning\code\sfl-lab\matlab\out\SFLX1_sim_weight.csv"),
        "probe": Path(r"d:\deep-learning\code\sfl-lab\matlab\out\SFLX1_sim_probes.csv"),
        "weather": Path(r"d:\deep-learning\code\sfl-lab\matlab\out\SFLX1_sim_weather.csv"),
    }
    parts = []
    for name, path in files.items():
        data = path.read_bytes()
        header = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"; filename="{path.name}"\r\n'
            "Content-Type: text/csv\r\n\r\n"
        ).encode()
        parts.append(header + data + b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode())
    body = b"".join(parts)
    req_up = urllib.request.Request(
        base + "/api/sessions/files",
        data=body,
        method="POST",
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req_up, timeout=180) as resp:
        up = json.loads(resp.read().decode())
    print("UPLOAD", {k: up.get(k) for k in ["id", "weightRows", "probeRows", "weatherRows", "weightError", "weightSuspect", "warning"]})
    if up.get("weightRows", 0) != 14 * 1440:
        issues.append(f"upload weight rows {up.get('weightRows')}")
    if up.get("probeRows", 0) < 14 * 140:
        issues.append(f"upload probe rows {up.get('probeRows')}")
    if up.get("weatherRows", 0) < 14 * 90:
        issues.append(f"upload weather rows {up.get('weatherRows')}")
    sid2 = up["id"]
    b2 = req("GET", f"{base}/api/sessions/{sid2}/balance")
    print("UPLOAD BALANCE", b2.get("totals"), "daily", len(b2.get("daily") or []))
    w2 = req("GET", f"{base}/api/sessions/{sid2}/series?group=weight&maxPoints=2400")
    print("UPLOAD pump", len(w2.get("pumpEvents") or []), "marks", len(w2.get("marks") or []), "lywAnom", yrange(w2, "lywAnomMm"))
    print("ISSUES", issues or ["none"])
    Path(r"d:\deep-learning\code\sfl-lab\matlab\out\qa_report.json").write_text(
        json.dumps({"demo": {k: demo.get(k) for k in keep}, "issues": issues, "upload": {k: up.get(k) for k in ["id", "weightRows", "probeRows", "weatherRows"]}}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
