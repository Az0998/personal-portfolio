# -*- coding: utf-8 -*-
"""Generate Xinanjiang bench forcings + series for /xaj-bench (schematic basin)."""
from __future__ import annotations

import json
import math
import random
from pathlib import Path

MODULE = Path(__file__).resolve().parents[1]
REPO = Path(__file__).resolve().parents[3]
DATA = MODULE / "data"
PUBLIC = REPO / "public" / "xaj-bench"

# Truth params used to synthesize "observed" flow
TRUE = dict(
    K=0.85, B=0.3, IMP=0.02, WUM=20, WLM=60, WDM=40, C=0.15,
    SM=22, EX=1.2, KI=0.3, KG=0.4, CS=0.65, CI=0.82, CG=0.975,
    L=1, area_km2=1200,
)
# Hand calibration (demo) — intentionally nearby
CAL = dict(
    K=0.88, B=0.28, IMP=0.02, WUM=18, WLM=65, WDM=40, C=0.15,
    SM=24, EX=1.2, KI=0.32, KG=0.38, CS=0.68, CI=0.82, CG=0.978,
    L=1, area_km2=1200,
)


def mm_to_cms(r, area):
    return r * area / 86.4


def init_state(p):
    L = max(1, int(round(p["L"])))
    return {
        "wu": p["WUM"] * 0.65,
        "wl": p["WLM"] * 0.55,
        "wd": p["WDM"] * 0.45,
        "s": p["SM"] * 0.15,
        "qs": 0.0,
        "qi": 0.0,
        "qg": 0.0,
        "qsLag": [0.0] * L,
    }


def step_xaj(p, st, precip, em):
    P = max(0.0, precip)
    E0 = max(0.0, em) * p["K"]
    WM = p["WUM"] + p["WLM"] + p["WDM"]
    WMM = WM * (1 + p["B"])
    wu, wl, wd = st["wu"], st["wl"], st["wd"]
    s, qs, qi, qg = st["s"], st["qs"], st["qi"], st["qg"]
    L = max(1, int(round(p["L"])))
    qsLag = list(st["qsLag"]) if len(st["qsLag"]) == L else [0.0] * L

    pe = 0.0
    if P + wu >= E0:
        wu = wu + P - E0
        pe = P - E0
    else:
        eu = P + wu
        wu = 0.0
        need = E0 - eu
        if need * (wl / max(p["WLM"], 1e-6)) <= wl:
            wl -= need * (wl / p["WLM"])
        else:
            el = wl
            wl = 0.0
            ed = min(wd, (E0 - eu - el) * p["C"])
            wd -= ed
        pe = 0.0
    if wu > p["WUM"]:
        wl += wu - p["WUM"]
        wu = p["WUM"]
    if wl > p["WLM"]:
        wd += wl - p["WLM"]
        wl = p["WLM"]
    wd = min(max(wd, 0.0), p["WDM"])

    R = 0.0
    if pe > 0:
        W = wu + wl + wd
        A = WMM * (1 - (max(0.0, 1 - W / WM)) ** (1 / (1 + p["B"])))
        if pe + A >= WMM:
            R = pe - (WM - W)
        else:
            R = pe - (WM - W) + WM * (1 - (pe + A) / WMM) ** (1 + p["B"])
        R = max(0.0, R)
        remain = W + pe - R
        wu = min(p["WUM"], remain)
        remain -= wu
        wl = min(p["WLM"], remain)
        remain -= wl
        wd = min(p["WDM"], max(0.0, remain))

    R = R * (1 - p["IMP"]) + (pe * p["IMP"] if pe > 0 else 0.0)

    RS = RI = RG = 0.0
    if R > 0:
        fr = max(1e-4, min(1.0, R / pe)) if pe > 0 else 1.0
        s += R
        if s > p["SM"]:
            RS = (s - p["SM"]) * fr
            s = p["SM"]
        RI = s * p["KI"]
        RG = s * p["KG"]
        if RI + RG > s:
            f = s / (RI + RG)
            RI *= f
            RG *= f
        s = max(0.0, s - RI - RG)

    qsLag.append(RS)
    rs_lag = qsLag.pop(0)
    qs = p["CS"] * qs + (1 - p["CS"]) * rs_lag
    qi = p["CI"] * qi + (1 - p["CI"]) * RI
    qg = p["CG"] * qg + (1 - p["CG"]) * RG
    q = mm_to_cms(qs + qi + qg, p["area_km2"])
    return q, {
        "wu": wu, "wl": wl, "wd": wd, "s": s,
        "qs": qs, "qi": qi, "qg": qg, "qsLag": qsLag,
    }


def run_xaj(p, precip, em):
    st = init_state(p)
    out = []
    for i in range(len(precip)):
        q, st = step_xaj(p, st, precip[i], em[i])
        out.append(q)
    return out


def nse(obs, sim):
    n = min(len(obs), len(sim))
    mean = sum(obs[:n]) / n
    num = sum((obs[i] - sim[i]) ** 2 for i in range(n))
    den = sum((obs[i] - mean) ** 2 for i in range(n))
    return float("nan") if den < 1e-12 else 1 - num / den


def rmse(obs, sim):
    n = min(len(obs), len(sim))
    return math.sqrt(sum((obs[i] - sim[i]) ** 2 for i in range(n)) / n)


def persistence(obs):
    return [obs[0]] + obs[:-1]


def synth_climate(n=730, seed=42):
    rng = random.Random(seed)
    precip, em, dates = [], [], []
    for i in range(n):
        # Water year-ish seasonality: wetter summer
        doy = i % 365
        season = 0.55 + 0.45 * math.sin((doy - 60) / 365 * 2 * math.pi)
        storm = 0.0
        if rng.random() < 0.18 * season:
            storm = rng.gammavariate(2.2, 6.0) * season
        drizzle = rng.random() * 1.2 if rng.random() < 0.25 else 0.0
        p = min(80.0, storm + drizzle)
        e = 1.2 + 3.5 * (0.5 + 0.5 * math.sin((doy - 80) / 365 * 2 * math.pi)) + rng.uniform(-0.2, 0.2)
        precip.append(round(p, 2))
        em.append(round(max(0.5, e), 2))
        y = 2022 + (i // 365)
        d = i % 365
        # rough date label
        dates.append(f"{y}-{(d // 30) + 1:02d}-{(d % 28) + 1:02d}")
    return dates, precip, em


def fit_lag_lstm(precip, obs, lags=7):
    """Ridge on [1, P lags, Q lags] — schematic sequence model labeled Lag-LSTM."""
    import numpy as np

    X, y = [], []
    for t in range(lags, len(obs)):
        row = [1.0]
        for k in range(lags):
            row.append(precip[t - k])
        for k in range(1, 4):
            row.append(obs[t - k])
        X.append(row)
        y.append(obs[t])
    X = np.asarray(X)
    y = np.asarray(y)
    lam = 1e-2
    w = np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)
    out = list(obs)
    for t in range(lags, len(obs)):
        row = [1.0]
        for k in range(lags):
            row.append(precip[t - k])
        for k in range(1, 4):
            row.append(obs[t - k])  # teacher forcing for fair day-ahead metric
        out[t] = float(max(0.0, row @ w))
    return out, w.tolist()


def main():
    DATA.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    dates, precip, em = synth_climate(730, seed=7)
    q_true = run_xaj(TRUE, precip, em)
    rng = random.Random(9)
    q_obs = [max(0.0, q * (1 + rng.uniform(-0.06, 0.06)) + rng.gauss(0, 0.8)) for q in q_true]
    q_xaj = run_xaj(CAL, precip, em)
    q_pers = persistence(q_obs)
    try:
        q_lstm, w = fit_lag_lstm(precip, q_obs)
        lstm_note = "同数据滞后特征脊回归序列模型（示意 LSTM 对照，非完整深度学习工程）"
    except Exception:
        q_lstm, w = q_pers, []
        lstm_note = "numpy 不可用，回退 Persistence"

    warmup = 60
    metrics = {}
    for name, series in [("xaj", q_xaj), ("persistence", q_pers), ("lag_lstm", q_lstm)]:
        o, s = q_obs[warmup:], series[warmup:]
        metrics[name] = {
            "NSE": round(nse(o, s), 3),
            "RMSE": round(rmse(o, s), 2),
        }

    payload = {
        "basin": {
            "id": "DEMO-XAJ-1200",
            "name": "示意小流域（新安江对照）",
            "name_en": "Schematic small basin for XAJ bench",
            "area_km2": 1200,
            "timestep": "daily",
            "schematic": True,
            "note": "强迫与「观测」由真理参数新安江+噪声合成，用于讲解产汇流与对照，非实测站网。",
        },
        "calibration": {
            "method": "手工试错 + 目视过程线 / NSE（暖期 60 d）",
            "period": "2022–2023 synthetic",
            "notes": [
                "先定面积与蒸发折算 K，使年蒸发量级合理",
                "再调 WUM/WLM/WDM、B，贴合洪水起涨与蓄满产流",
                "最后调 SM/KI/KG 与 CS/CI/CG，分解洪峰与基流",
                "本页可在浏览器改参即时重跑新安江（TS 实现与脚本同构）",
            ],
        },
        "params_truth": TRUE,
        "params_calibrated": CAL,
        "lag_lstm_weights": w,
        "lstm_note": lstm_note,
        "warmup_days": warmup,
        "metrics": metrics,
        "series": {
            "date": dates,
            "precip_mm": precip,
            "em_mm": em,
            "q_obs": [round(x, 3) for x in q_obs],
            "q_xaj": [round(x, 3) for x in q_xaj],
            "q_persistence": [round(x, 3) for x in q_pers],
            "q_lag_lstm": [round(x, 3) for x in q_lstm],
        },
    }
    text = json.dumps(payload, ensure_ascii=False, indent=2)
    (DATA / "benchmark.json").write_text(text, encoding="utf-8")
    (PUBLIC / "benchmark.json").write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print("metrics", metrics)
    print("wrote", PUBLIC / "benchmark.json")


if __name__ == "__main__":
    main()
