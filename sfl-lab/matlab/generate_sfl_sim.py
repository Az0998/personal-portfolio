"""Port of generate_sfl_sim.m — run without MATLAB to make classroom CSVs."""
from __future__ import annotations

import json
import math
from datetime import datetime, timedelta
from pathlib import Path
import random

AREA = 0.0707
START = datetime(2024, 6, 1)
DAYS = 14


def hour_of(t: datetime) -> int:
    return t.hour


def day_index(t: datetime) -> int:
    return (t - START).days


def main(out_dir: Path | None = None) -> Path:
    out = out_dir or (Path(__file__).resolve().parent / "out")
    out.mkdir(parents=True, exist_ok=True)

    n_w = DAYS * 1440
    rng = random.Random(20240601)
    lyw, sww = 72.40, 2.18
    rows_w = []
    for i in range(n_w):
        t = START + timedelta(minutes=i)
        hour, day = hour_of(t), day_index(t)
        if 6 <= hour < 19:
            lyw -= 0.000055
        else:
            lyw -= 0.000012
        if day == 4 and 14 <= hour < 18:
            lyw += 0.0062
        if day == 10 and 9 <= hour < 11:
            lyw += 0.0031
        lyw += rng.gauss(0, 0.0009)
        wind = 0.018 * math.sin(i / 2.0) if day == 7 and 2 <= hour < 5 else 0
        spike = 0.48 if i in (1850, 7320, 15120) else 0
        pin = pout = 0.0
        if day == 4 and hour == 19 and t.minute < 4:
            pout = 8
            sww += 0.011
        if day == 11 and hour == 6 and t.minute < 3:
            pin = 6
            sww -= 0.008
            lyw += 0.008
        sww += rng.gauss(0, 0.0008)
        ts = t.strftime("%Y/%m/%d %H:%M:%S.000")
        rows_w.append(f"{ts},n,{lyw + wind + spike:.4f},{sww:.4f},{pin:.1f},{pout:.1f}")
    (out / "SFLX1_sim_weight.csv").write_text(
        '"Timestamp","TZ","L1-LYW (kg)","L1-SWW (kg)","L1-Pump-in (s)","L1-Pump-out (s)"\n'
        + "\n".join(rows_w)
        + "\n",
        encoding="utf-8",
    )

    rng = random.Random(20240602)
    n_p = DAYS * 144
    e = [12.4, 21.6, 16.2]
    rows_p = []
    for i in range(n_p):
        t = START + timedelta(minutes=10 * i)
        hour, day = hour_of(t), day_index(t)
        sun = max(0.0, math.sin((hour - 6) / 12.0 * math.pi))
        t1 = 16.5 + 9.5 * sun + rng.gauss(0, 0.15)
        t2 = 17.2 + 3.2 * sun + rng.gauss(0, 0.08)
        t3 = 16.8 + 1.1 * sun + rng.gauss(0, 0.05)
        if day == 4 and 14 <= hour < 20:
            e[0] += 0.42
        elif 6 <= hour < 19:
            e[0] -= 0.012
        else:
            e[0] -= 0.004
        e[0] += 0.55 * (t1 - 20) / 20.0
        if day == 4 and hour >= 18:
            e[1] += 0.008
        if 5 <= day <= 6 and 2 <= hour < 10:
            e[2] += 0.035
        echo1 = min(35, max(6, e[0] + rng.gauss(0, 0.08)))
        echo2 = min(28, max(18, e[1] + rng.gauss(0, 0.04)))
        echo3 = min(24, max(12, e[2] + rng.gauss(0, 0.05)))
        mps3 = -9990 if day == 8 and hour < 6 else -90
        ts = t.strftime("%Y/%m/%d %H:%M:%S.000")
        rows_p.append(
            f"{ts},{echo1:.3f},{echo2:.3f},{echo3:.3f},"
            f"{-18 - 0.4 * max(0, 16 - echo1):.1f},-55.0,{mps3:.1f},"
            f"{0.12 + 0.01 * (echo1 - 12) / 10:.4f},0.2200,{0.18 + (0.03 if day > 4 else 0):.4f},"
            f"{t1:.2f},{t2:.2f},{t3:.2f},{32 + rng.gauss(0, 0.4):.2f},30.00,{t3 + 0.3:.2f},{15 + 11 * sun:.2f},{18 + 4 * sun:.2f}"
        )
    header_p = (
        '"Timestamp","L1-Echo-T1","L1-Echo-T2","L1-Echo-T3",'
        '"L1-MPS-T1","L1-MPS-T2","L1-MPS-T3","L1-EC-T1","L1-EC-T2","L1-EC-T3",'
        '"L1-Temp-T1","L1-Temp-T2","L1-Temp-T3","L1-VTENS-T4","L1-RefTens-T4",'
        '"L1-BottomTemp","L1-FieldTemp-T4","FieldBox1-Temp"\n'
    )
    (out / "SFLX1_sim_probes.csv").write_text(header_p + "\n".join(rows_p) + "\n", encoding="utf-8")

    rng = random.Random(20240603)
    n_z = DAYS * 96
    rows_z = []
    for i in range(n_z):
        t = START + timedelta(minutes=15 * i)
        hour, day = hour_of(t), day_index(t)
        sun = max(0.0, math.sin((hour - 6) / 12.0 * math.pi))
        p = 0.0
        if day == 4 and 14 <= hour < 18:
            p = 1.35
        if day == 10 and 9 <= hour < 11:
            p = 0.55
        ts = t.strftime("%Y/%m/%d %H:%M:%S")
        rows_z.append(
            f"{ts},{p:.3f},{14 + 12 * sun + rng.gauss(0, 0.3):.2f},{85 - 35 * sun:.1f},{920 * sun:.1f},{1.2 + 0.8 * sun:.2f}"
        )
    (out / "SFLX1_sim_weather.csv").write_text(
        '"Timestamp","Precipitation","AirTemperature","RelativeHumidity","SolarRadiation","WindSpeed"\n'
        + "\n".join(rows_z)
        + "\n",
        encoding="utf-8",
    )
    (out / "sim_truth.json").write_text(
        json.dumps(
            {
                "areaM2": AREA,
                "mmPerKg": 1 / AREA,
                "start": "2024-06-01",
                "days": DAYS,
                "rainDays": ["2024-06-05", "2024-06-11"],
                "pumpNotRain": True,
                "note": "浅层先湿、深层滞后；白天 theta 含介电假抬；泵不是雨。",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    # 30-min preview for the personal-site landing (not a substitute for the full CSV).
    mm_per_kg = 1 / AREA
    lyw0 = float(rows_w[0].split(",")[2])
    preview_t, preview_lyw, preview_echo, preview_rain = [], [], [], []
    for i, row in enumerate(rows_w):
        if i % 30 != 0:
            continue
        parts = row.split(",")
        t = datetime.strptime(parts[0], "%Y/%m/%d %H:%M:%S.000")
        lyw = float(parts[2])
        preview_t.append(int(t.timestamp() * 1000))
        preview_lyw.append(round((lyw - lyw0) * mm_per_kg, 4))
    for i, row in enumerate(rows_p):
        if i % 3 != 0:
            continue
        parts = row.split(",")
        preview_echo.append(round(float(parts[1]), 3))
    rain_by_slot = []
    for row in rows_z:
        parts = row.split(",")
        rain_by_slot.append(float(parts[1]))
    for i in range(len(preview_t)):
        # 30 min vs 15 min weather
        j = min(i * 2, len(rain_by_slot) - 1)
        preview_rain.append(rain_by_slot[j] + (rain_by_slot[j + 1] if j + 1 < len(rain_by_slot) else 0))
    n = min(len(preview_t), len(preview_echo), len(preview_rain))
    (out / "sim_preview.json").write_text(
        json.dumps(
            {
                "t": preview_t[:n],
                "lywAnomMm": preview_lyw[:n],
                "echo1": preview_echo[:n],
                "rainMm30": preview_rain[:n],
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print("wrote", out)
    return out


if __name__ == "__main__":
    main()
