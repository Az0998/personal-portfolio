package com.sflab.engine;

import com.sflab.model.Const;
import com.sflab.model.Tables;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.sflab.engine.Stats.fin;
import static com.sflab.engine.Stats.holdLast;
import static com.sflab.engine.Stats.withoutSteps;

public class WaterBalanceEngine {

    public static class Flux10 {
        public long t;
        public double precip;
        public double et;
        public double delta;
        public boolean gap;
        public boolean disturbed;
    }

    public static class Daily {
        public String date;
        public double p;
        public double et;
        public double d;
        public double iUp;
        public double ds;
        public double closure;
        public double dsProfile;
        public double et0;
        public double meteoP;
        public boolean official;
        public boolean midnight;
    }

    public static class Result {
        public List<Flux10> flux = new ArrayList<>();
        public List<Daily> daily = new ArrayList<>();
        public List<Flux10> filteredFlux = new ArrayList<>();
        public Map<String, Double> totals = new LinkedHashMap<>();
        public List<String> notes = new ArrayList<>();
    }

    public Result run(Tables.Weight w, QcEngine.WeightFlags wf, double[] filteredMm,
                      Tables.Probe probe, double[][] thetaCorrPct, Tables.Weather weather,
                      boolean free, boolean snow) {
        Result r = new Result();
        int n = w.n();
        double[] lywC = withoutSteps(w.lyw, 0.05);
        double[] swwH = holdLast(w.sww);
        double[] swwC = withoutSteps(swwH, 0.05);
        double[] sys = new double[n];
        for (int i = 0; i < n; i++) {
            if (!fin(lywC[i])) sys[i] = Double.NaN;
            else sys[i] = fin(swwC[i]) ? lywC[i] + swwC[i] : lywC[i];
        }
        r.flux = flux10(w.t, sys, wf);
        if (filteredMm != null && filteredMm.length == n) {
            r.filteredFlux = fluxFromMm(w.t, filteredMm, wf);
        }
        r.daily = daily(w.t, lywC, swwC, w.sww, r.flux, probe, thetaCorrPct, weather, free, snow);
        double p = 0, et = 0, d = 0, ds = 0;
        int off = 0;
        for (Daily day : r.daily) {
            if (!day.official) continue;
            p += day.p;
            et += day.et;
            d += day.d;
            ds += day.ds;
            off++;
        }
        r.totals.put("officialDays", (double) off);
        r.totals.put("precipMm", p);
        r.totals.put("etMm", et);
        r.totals.put("drainMm", d);
        r.totals.put("dsMm", ds);
        r.totals.put("closureMm", p - et - d - ds);
        r.notes.add("面积 0.0707 m²，1 kg = " + String.format("%.2f", Const.MM_PER_KG) + " mm。降水门限 5 g ≈ "
                + String.format("%.3f", Const.MASS_GATE_MM) + " mm（手册误写 0.035 mm，计算不用该值）。");
        r.notes.add("无滤波：10 min 过门限增重记降水；正式蒸散用相邻午夜系统重量差。泵调水不是降水或蒸散。");
        r.notes.add("闭合检验：P − ET = ΔS + (D − I)。剖面 ΔS 用订正后 θ，只作对照。");
        if (!free) r.notes.add("未确认筒体与储水瓶自由度，正式午夜蒸散不汇总。");
        if (snow) r.notes.add("已勾选积雪或边缘植物，这些日子不进正式蒸散。");
        return r;
    }

    private List<Flux10> flux10(long[] t, double[] sys, QcEngine.WeightFlags wf) {
        Map<Long, Bin> bins = new LinkedHashMap<>();
        for (int i = 0; i < t.length; i++) {
            long key = (t[i] / 600_000L) * 600_000L;
            Bin b = bins.computeIfAbsent(key, k -> new Bin());
            boolean drop = wf.spike[i] || wf.wind[i] || wf.pump[i];
            if (!drop && fin(sys[i])) { b.s += sys[i]; b.c++; }
            b.disturbed |= wf.wind[i] || wf.step[i] || wf.bottle[i];
        }
        List<Flux10> out = new ArrayList<>();
        Double prev = null;
        Long prevT = null;
        for (Map.Entry<Long, Bin> e : bins.entrySet()) {
            Bin b = e.getValue();
            Flux10 f = new Flux10();
            f.t = e.getKey();
            if (b.c == 0) { f.gap = true; out.add(f); prev = null; prevT = null; continue; }
            double mean = b.s / b.c;
            boolean adj = prevT != null && e.getKey() - prevT == 600_000L && prev != null;
            double delta = adj ? mean - prev : Double.NaN;
            prev = mean;
            prevT = e.getKey();
            f.disturbed = b.disturbed;
            f.gap = !fin(delta);
            f.delta = fin(delta) ? delta * Const.MM_PER_KG : Double.NaN;
            if (!f.gap && !f.disturbed && delta >= Const.MASS_GATE_KG) f.precip = delta * Const.MM_PER_KG;
            if (!f.gap && !f.disturbed && delta < 0) f.et = -delta * Const.MM_PER_KG;
            out.add(f);
        }
        return out;
    }

    private List<Flux10> fluxFromMm(long[] t, double[] mm, QcEngine.WeightFlags wf) {
        List<Flux10> out = new ArrayList<>();
        Double prev = null;
        for (int i = 0; i < t.length; i++) {
            if ((i % 10) != 0) continue;
            Flux10 f = new Flux10();
            f.t = t[i];
            boolean dist = wf.wind[i] || wf.step[i] || wf.bottle[i] || wf.pump[i];
            f.disturbed = dist;
            if (!fin(mm[i]) || dist) { f.gap = true; out.add(f); prev = null; continue; }
            if (prev != null) {
                double d = mm[i] - prev;
                f.delta = d;
                if (d > 0) f.precip = d;
                if (d < 0) f.et = -d;
            } else f.gap = true;
            prev = mm[i];
            out.add(f);
        }
        return out;
    }

    private List<Daily> daily(long[] t, double[] lyw, double[] sww, double[] swwRaw, List<Flux10> flux,
                             Tables.Probe probe, double[][] theta, Tables.Weather weather,
                             boolean free, boolean snow) {
        Map<String, Midnight> mid = new LinkedHashMap<>();
        for (int i = 0; i < t.length; i++) {
            if (!fin(lyw[i])) continue;
            LocalDate d = Instant.ofEpochMilli(t[i]).atZone(ZoneOffset.UTC).toLocalDate();
            String key = d.toString();
            int sec = Instant.ofEpochMilli(t[i]).atZone(ZoneOffset.UTC).toLocalTime().toSecondOfDay();
            Midnight m = mid.computeIfAbsent(key, k -> new Midnight());
            if (m.first == null) m.first = new Point(t[i], lyw[i], sww[i], fin(swwRaw[i]));
            if (sec <= 300 && (m.mid == null || t[i] < m.mid.t)) {
                m.mid = new Point(t[i], lyw[i], sww[i], fin(swwRaw[i]));
            }
        }
        Map<String, Double> p10 = new LinkedHashMap<>();
        for (Flux10 f : flux) {
            String key = Instant.ofEpochMilli(f.t).atZone(ZoneOffset.UTC).toLocalDate().toString();
            p10.merge(key, f.precip, Double::sum);
        }
        Map<String, Double> meteo = dailyMeteoP(weather);
        Map<String, double[]> thetaDay = dailyTheta(probe, theta);
        List<String> days = new ArrayList<>(mid.keySet());
        days.sort(String::compareTo);
        List<Daily> out = new ArrayList<>();
        for (int i = 0; i < days.size() - 1; i++) {
            Midnight aM = mid.get(days.get(i));
            Midnight bM = mid.get(days.get(i + 1));
            Point a = aM.mid != null ? aM.mid : aM.first;
            Point b = bM.mid != null ? bM.mid : bM.first;
            if (a == null || b == null) continue;
            Daily d = new Daily();
            d.date = days.get(i);
            double dLyw = b.lyw - a.lyw;
            boolean swwOk = a.swwOk && b.swwOk && fin(a.sww) && fin(b.sww);
            double dSww = swwOk ? b.sww - a.sww : Double.NaN;
            d.ds = dLyw * Const.MM_PER_KG;
            d.d = swwOk ? Math.max(dSww, 0) * Const.MM_PER_KG : 0;
            d.iUp = swwOk ? Math.max(-dSww, 0) * Const.MM_PER_KG : 0;
            d.p = p10.getOrDefault(d.date, 0.0);
            double dSys = swwOk ? dLyw + dSww : dLyw;
            d.et = Math.max(-dSys, 0) * Const.MM_PER_KG;
            d.midnight = aM.mid != null && bM.mid != null;
            d.official = d.midnight && swwOk && free && !snow;
            d.closure = d.p - d.et - d.ds - d.d + d.iUp;
            d.meteoP = meteo.getOrDefault(d.date, 0.0);
            d.dsProfile = profileDs(thetaDay.get(days.get(i)), thetaDay.get(days.get(i + 1)));
            d.et0 = Double.NaN;
            out.add(d);
        }
        fillEt0(out, weather);
        return out;
    }

    private double profileDs(double[] a, double[] b) {
        if (a == null || b == null) return Double.NaN;
        double s = 0;
        int c = 0;
        for (int d = 0; d < 3; d++) {
            if (!fin(a[d]) || !fin(b[d])) continue;
            s += (b[d] - a[d]) / 100.0 * Const.LAYER_MM[d];
            c++;
        }
        return c == 0 ? Double.NaN : s;
    }

    private Map<String, double[]> dailyTheta(Tables.Probe probe, double[][] theta) {
        Map<String, double[]> sum = new LinkedHashMap<>();
        Map<String, int[]> cnt = new LinkedHashMap<>();
        if (probe == null || theta == null) return sum;
        for (int i = 0; i < probe.n(); i++) {
            String key = Instant.ofEpochMilli(probe.t[i]).atZone(ZoneOffset.UTC).toLocalDate().toString();
            double[] s = sum.computeIfAbsent(key, k -> new double[3]);
            int[] c = cnt.computeIfAbsent(key, k -> new int[3]);
            for (int d = 0; d < 3; d++) {
                if (fin(theta[d][i])) { s[d] += theta[d][i]; c[d]++; }
            }
        }
        for (String k : sum.keySet()) {
            double[] s = sum.get(k);
            int[] c = cnt.get(k);
            for (int d = 0; d < 3; d++) s[d] = c[d] == 0 ? Double.NaN : s[d] / c[d];
        }
        return sum;
    }

    private Map<String, Double> dailyMeteoP(Tables.Weather weather) {
        Map<String, Double> m = new LinkedHashMap<>();
        if (weather == null) return m;
        for (int i = 0; i < weather.n(); i++) {
            if (!fin(weather.precip[i])) continue;
            String key = Instant.ofEpochMilli(weather.t[i]).atZone(ZoneOffset.UTC).toLocalDate().toString();
            m.merge(key, weather.precip[i], Double::sum);
        }
        return m;
    }

    private void fillEt0(List<Daily> days, Tables.Weather weather) {
        if (weather == null) return;
        Map<String, Agg> a = new LinkedHashMap<>();
        for (int i = 0; i < weather.n(); i++) {
            String key = Instant.ofEpochMilli(weather.t[i]).atZone(ZoneOffset.UTC).toLocalDate().toString();
            Agg g = a.computeIfAbsent(key, k -> new Agg());
            if (fin(weather.airT[i])) { g.tMin = Math.min(g.tMin, weather.airT[i]); g.tMax = Math.max(g.tMax, weather.airT[i]); g.tSum += weather.airT[i]; g.n++; }
            if (fin(weather.rh[i])) { g.rhSum += weather.rh[i]; g.nrh++; }
            if (fin(weather.rs[i])) g.rsSum += weather.rs[i] * 0.25 * 0.0036;
            if (fin(weather.wind[i])) { g.uSum += weather.wind[i]; g.nu++; }
        }
        for (Daily d : days) {
            Agg g = a.get(d.date);
            if (g == null || g.n == 0) continue;
            double tmean = g.tSum / g.n;
            double tmax = g.tMax, tmin = g.tMin;
            double rh = g.nrh == 0 ? 50 : g.rhSum / g.nrh;
            double u2 = g.nu == 0 ? 1.0 : g.uSum / g.nu;
            double rn = Math.max(0, g.rsSum * (1 - 0.23));
            double es = 0.6108 * Math.exp(17.27 * tmean / (tmean + 237.3));
            double ea = es * Math.max(0.05, Math.min(1, rh / 100.0));
            double delta = 4098 * es / Math.pow(tmean + 237.3, 2);
            double gamma = 0.066;
            double num = 0.408 * delta * rn + gamma * (900 / (tmean + 273)) * u2 * (es - ea);
            double den = delta + gamma * (1 + 0.34 * u2);
            d.et0 = den == 0 ? Double.NaN : Math.max(0, num / den);
        }
    }

    private static class Bin { double s; int c; boolean disturbed; }
    private static class Point {
        long t; double lyw; double sww; boolean swwOk;
        Point(long t, double lyw, double sww, boolean swwOk) {
            this.t = t; this.lyw = lyw; this.sww = sww; this.swwOk = swwOk;
        }
    }
    private static class Midnight { Point mid; Point first; }
    private static class Agg {
        double tMin = Double.POSITIVE_INFINITY, tMax = Double.NEGATIVE_INFINITY, tSum, rhSum, rsSum, uSum;
        int n, nrh, nu;
    }
}
