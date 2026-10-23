package com.sflab.engine;

import com.sflab.model.Tables;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

/**
 * Classroom series with lysimeter-like morphology. Not field measurements.
 */
public final class SyntheticDemo {
    private SyntheticDemo() {}

    public static final int DAYS = 14;
    public static final LocalDateTime START = LocalDateTime.of(2024, 6, 1, 0, 0);

    /** Same classroom physics as matlab/generate_sfl_sim.m — not field measurements. */
    public static Map<String, Object> truth() {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("source", "matlab-bucket");
        t.put("script", "matlab/generate_sfl_sim.m");
        t.put("start", "2024-06-01");
        t.put("days", DAYS);
        t.put("rainDays", List.of("2024-06-05", "2024-06-11"));
        t.put("spikeMinutes", List.of(1850, 7320, 15120));
        t.put("pumpOut", "2024-06-05 19:00 排出（不是雨）");
        t.put("pumpIn", "2024-06-12 06:00 补入（不是雨）");
        t.put("dielectric", "15 cm θ 含日周期表观抬升，Kapilaratne 订正对象");
        t.put("layerLag", "35 cm 雨后当晚微抬；55 cm 第 5–6 日凌晨");
        t.put("note", "正向仿真真值：泵不是雨；浅层先湿；白天 θ 假高。");
        return t;
    }

    public static Tables.Weight weight() {
        int n = DAYS * 24 * 60;
        long t0 = START.toInstant(ZoneOffset.UTC).toEpochMilli();
        Random rng = new Random(20240601);
        Tables.Weight w = new Tables.Weight();
        w.t = new long[n];
        w.lyw = new double[n];
        w.sww = new double[n];
        w.pumpIn = new double[n];
        w.pumpOut = new double[n];
        double lyw = 72.40;
        double sww = 2.18;
        for (int i = 0; i < n; i++) {
            w.t[i] = t0 + (long) i * 60_000;
            int tod = i % 1440;
            int hour = tod / 60;
            int day = i / 1440;
            if (hour >= 6 && hour < 19) lyw -= 0.000055;
            else lyw -= 0.000012;
            if (day == 4 && hour >= 14 && hour < 18) lyw += 0.0062;
            if (day == 10 && hour >= 9 && hour < 11) lyw += 0.0031;
            lyw += rng.nextGaussian() * 0.0009;
            double wind = (day == 7 && hour >= 2 && hour < 5) ? 0.018 * Math.sin(i / 2.0) : 0;
            double spike = (i == 1850 || i == 7320 || i == 15120) ? 0.48 : 0;
            w.lyw[i] = lyw + wind + spike;
            if (day == 4 && hour == 19 && tod % 60 < 4) {
                w.pumpOut[i] = 8;
                sww += 0.011;
            } else w.pumpOut[i] = 0;
            if (day == 11 && hour == 6 && tod % 60 < 3) {
                w.pumpIn[i] = 6;
                sww -= 0.008;
                lyw += 0.008;
            } else w.pumpIn[i] = 0;
            sww += rng.nextGaussian() * 0.0008;
            w.sww[i] = sww;
        }
        return w;
    }

    public static Tables.Probe probe() {
        int n = DAYS * 24 * 6;
        long t0 = START.toInstant(ZoneOffset.UTC).toEpochMilli();
        Random rng = new Random(20240602);
        Tables.Probe p = new Tables.Probe();
        p.t = new long[n];
        p.vtens = new double[n];
        p.refTens = new double[n];
        p.bottomTemp = new double[n];
        p.fieldTemp = new double[n];
        p.boxTemp = new double[n];
        for (int d = 0; d < 3; d++) {
            p.echo[d] = new double[n];
            p.mps[d] = new double[n];
            p.ec[d] = new double[n];
            p.temp[d] = new double[n];
        }
        double e1 = 12.4, e2 = 21.6, e3 = 16.2;
        for (int i = 0; i < n; i++) {
            p.t[i] = t0 + (long) i * 600_000;
            int tod = i % 144;
            int hour = tod / 6;
            int day = i / 144;
            double sun = Math.max(0, Math.sin((hour - 6) / 12.0 * Math.PI));
            p.temp[0][i] = 16.5 + 9.5 * sun + rng.nextGaussian() * 0.15;
            p.temp[1][i] = 17.2 + 3.2 * sun + rng.nextGaussian() * 0.08;
            p.temp[2][i] = 16.8 + 1.1 * sun + rng.nextGaussian() * 0.05;
            p.bottomTemp[i] = p.temp[2][i] + 0.3;
            p.fieldTemp[i] = 15 + 11 * sun;
            p.boxTemp[i] = 18 + 4 * sun;
            if (day == 4 && hour >= 14 && hour < 20) e1 += 0.42;
            else if (hour >= 6 && hour < 19) e1 -= 0.012;
            else e1 -= 0.004;
            e1 += 0.55 * (p.temp[0][i] - 20) / 20.0;
            if (day == 4 && hour >= 18) e2 += 0.008;
            if (day >= 5 && day <= 6 && hour >= 2 && hour < 10) e3 += 0.035;
            p.echo[0][i] = clamp(e1 + rng.nextGaussian() * 0.08, 6, 35);
            p.echo[1][i] = clamp(e2 + rng.nextGaussian() * 0.04, 18, 28);
            p.echo[2][i] = clamp(e3 + rng.nextGaussian() * 0.05, 12, 24);
            p.ec[0][i] = 0.12 + 0.01 * (p.echo[0][i] - 12) / 10;
            p.ec[1][i] = 0.22;
            p.ec[2][i] = 0.18 + (day > 4 ? 0.03 : 0);
            p.mps[0][i] = -18 - 0.4 * Math.max(0, 16 - p.echo[0][i]);
            p.mps[1][i] = -55;
            p.mps[2][i] = day == 8 && hour < 6 ? -9990 : -90;
            p.vtens[i] = 32 + rng.nextGaussian() * 0.4;
            p.refTens[i] = 30;
        }
        return p;
    }

    public static Tables.Weather weather() {
        int n = DAYS * 24 * 4;
        long t0 = START.toInstant(ZoneOffset.UTC).toEpochMilli();
        Random rng = new Random(20240603);
        Tables.Weather w = new Tables.Weather();
        w.t = new long[n];
        w.precip = new double[n];
        w.airT = new double[n];
        w.rh = new double[n];
        w.rs = new double[n];
        w.wind = new double[n];
        for (int i = 0; i < n; i++) {
            w.t[i] = t0 + (long) i * 900_000;
            int hour = (i / 4) % 24;
            int day = i / 96;
            double sun = Math.max(0, Math.sin((hour - 6) / 12.0 * Math.PI));
            w.rs[i] = 920 * sun;
            w.airT[i] = 14 + 12 * sun + rng.nextGaussian() * 0.3;
            w.rh[i] = 85 - 35 * sun;
            w.wind[i] = 1.2 + 0.8 * sun;
            w.precip[i] = 0;
            if (day == 4 && hour >= 14 && hour < 18) w.precip[i] = 1.35;
            if (day == 10 && hour >= 9 && hour < 11) w.precip[i] = 0.55;
        }
        return w;
    }

    private static double clamp(double v, double a, double b) {
        return Math.max(a, Math.min(b, v));
    }
}
