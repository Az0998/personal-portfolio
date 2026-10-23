package com.sflab.engine;

import com.sflab.model.Const;
import com.sflab.model.Tables;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.sflab.engine.Stats.fin;
import static com.sflab.engine.Stats.nans;
import static com.sflab.engine.Stats.slopeOrigin;
import static com.sflab.engine.Stats.tQuantile99;

/**
 * Kapilaratne and Lu (2017), Journal of Hydrology 551:203–216.
 * Only for dielectric VWC (5TE Echo), paired with same-depth soil temperature.
 */
public class TempCorrectionEngine {

    public static class LayerFit {
        public int layer;
        public String label;
        public double alpha;
        public int daysUsed;
        public int daysDropped;
        public double relChangePct;
        public List<Map<String, Object>> scatter = new ArrayList<>();
        public double[] correctedPct;
        public double[] acfRaw;
        public double[] acfCorr;
    }

    public static class Result {
        public String method = "B";
        public double tref = Const.TREF_C;
        public List<LayerFit> layers = new ArrayList<>();
        public List<String> notes = new ArrayList<>();
    }

    public Result run(Tables.Probe probe, Tables.Weather weather, String method, double tref, boolean useRainMask) {
        Result r = new Result();
        r.method = method == null ? "B" : method;
        r.tref = Double.isFinite(tref) ? tref : Const.TREF_C;
        boolean[] rainDay = rainDays(weather, probe.t);
        for (int d = 0; d < 3; d++) {
            r.layers.add(fitLayer(d, probe.t, probe.echo[d], probe.temp[d], rainDay, r.method, r.tref, useRainMask));
        }
        r.notes.add("只订 5TE 的 θ。T≤0 不订。");
        return r;
    }

    private LayerFit fitLayer(int d, long[] t, double[] echoPct, double[] temp, boolean[] rainDay,
                              String method, double tref, boolean useRainMask) {
        LayerFit fit = new LayerFit();
        fit.layer = d + 1;
        fit.label = Const.LAYER_LABEL[d];
        int n = t.length;
        double[] h = nans(n);
        for (int i = 0; i < n; i++) {
            if (fin(echoPct[i]) && echoPct[i] >= 0 && echoPct[i] <= 100) h[i] = echoPct[i] / 100.0;
        }
        Map<Integer, Day> days = groupDays(t, h, temp, rainDay);
        List<Integer> keys = new ArrayList<>(days.keySet());
        boolean[] use = new boolean[keys.size()];
        double[] x = new double[keys.size()];
        double[] y = new double[keys.size()];
        for (int i = 0; i < keys.size(); i++) {
            Day day = days.get(keys.get(i));
            use[i] = day.ok && !day.frozen && day.n >= 8;
            if (useRainMask && day.rain) use[i] = false;
            x[i] = day.hd * day.at;
            y[i] = day.ah;
        }
        int dropped;
        do {
            dropped = 0;
            double a = slopeOrigin(x, y, use);
            if (!fin(a)) break;
            int m = 0;
            double sse = 0;
            double sxx = 0;
            for (int i = 0; i < x.length; i++) if (use[i] && fin(x[i]) && fin(y[i])) {
                m++;
                double e = y[i] - a * x[i];
                sse += e * e;
                sxx += x[i] * x[i];
            }
            if (m < 8 || sxx == 0) break;
            double mse = sse / Math.max(1, m - 1);
            double tcrit = tQuantile99(Math.max(1, m - 1));
            for (int i = 0; i < x.length; i++) {
                if (!use[i] || !fin(x[i]) || !fin(y[i])) continue;
                double resid = y[i] - a * x[i];
                double hii = (x[i] * x[i]) / sxx;
                double mseI = Math.max(mse, 1e-12);
                double sr = resid / Math.sqrt(mseI * Math.max(1e-9, 1 - hii));
                if (sr - tcrit > 0) {
                    use[i] = false;
                    dropped++;
                }
            }
        } while (dropped > 0);
        fit.alpha = slopeOrigin(x, y, use);
        if (!fin(fit.alpha) || fit.alpha < 0) fit.alpha = 0;
        int used = 0, drop = 0;
        for (int i = 0; i < keys.size(); i++) {
            Day day = days.get(keys.get(i));
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("x", x[i]);
            pt.put("y", y[i]);
            pt.put("used", use[i]);
            pt.put("rain", day.rain);
            pt.put("frozen", day.frozen);
            fit.scatter.add(pt);
            if (use[i]) used++;
            else if (day.ok) drop++;
        }
        fit.daysUsed = used;
        fit.daysDropped = drop;
        fit.correctedPct = nans(n);
        double sumRaw = 0, sumCor = 0;
        int c = 0;
        for (int i = 0; i < n; i++) {
            if (!fin(h[i]) || !fin(temp[i]) || temp[i] <= 0) {
                fit.correctedPct[i] = echoPct[i];
                continue;
            }
            double href = apply(method, h[i], temp[i], tref, fit.alpha);
            fit.correctedPct[i] = href * 100.0;
            sumRaw += h[i];
            sumCor += href;
            c++;
        }
        if (c > 0 && sumRaw > 0) fit.relChangePct = 100.0 * (sumRaw - sumCor) / sumRaw;
        fit.acfRaw = acf(h, 36);
        double[] hc = nans(n);
        for (int i = 0; i < n; i++) hc[i] = fin(fit.correctedPct[i]) ? fit.correctedPct[i] / 100.0 : Double.NaN;
        fit.acfCorr = acf(hc, 36);
        return fit;
    }

    public static double apply(String method, double h, double T, double tref, double a) {
        double d = a * (T - tref);
        return switch (method == null ? "B" : method.toUpperCase()) {
            case "A" -> h / (1 + d);
            case "C" -> h * (1 - d);
            default -> {
                double num = 1 - d / 2.0;
                double den = 1 + d / 2.0;
                yield den == 0 ? h : h * num / den;
            }
        };
    }

    private static class Day {
        double minH = Double.POSITIVE_INFINITY, maxH = Double.NEGATIVE_INFINITY, sumH;
        double minT = Double.POSITIVE_INFINITY, maxT = Double.NEGATIVE_INFINITY;
        int n;
        boolean rain, frozen, ok;
        double hd, ah, at;
    }

    private Map<Integer, Day> groupDays(long[] t, double[] h, double[] temp, boolean[] rainDay) {
        Map<Integer, Day> map = new LinkedHashMap<>();
        for (int i = 0; i < t.length; i++) {
            if (!fin(h[i]) || !fin(temp[i])) continue;
            int key = (int) Math.floor(t[i] / 86_400_000.0);
            Day d = map.computeIfAbsent(key, k -> new Day());
            d.n++;
            d.sumH += h[i];
            d.minH = Math.min(d.minH, h[i]);
            d.maxH = Math.max(d.maxH, h[i]);
            d.minT = Math.min(d.minT, temp[i]);
            d.maxT = Math.max(d.maxT, temp[i]);
            if (temp[i] <= 0) d.frozen = true;
            if (rainDay != null && i < rainDay.length && rainDay[i]) d.rain = true;
        }
        for (Day d : map.values()) {
            d.hd = d.n > 0 ? d.sumH / d.n : Double.NaN;
            d.ah = 0.5 * (d.maxH - d.minH);
            d.at = 0.5 * (d.maxT - d.minT);
            d.ok = d.n >= 8 && fin(d.hd) && d.at > 0;
        }
        return map;
    }

    private boolean[] rainDays(Tables.Weather weather, long[] probeT) {
        boolean[] out = new boolean[probeT.length];
        if (weather == null || weather.n() == 0) return out;
        Map<Integer, Double> p = new LinkedHashMap<>();
        for (int i = 0; i < weather.n(); i++) {
            if (!fin(weather.precip[i])) continue;
            int key = (int) Math.floor(weather.t[i] / 86_400_000.0);
            p.merge(key, weather.precip[i], Double::sum);
        }
        for (int i = 0; i < probeT.length; i++) {
            int key = (int) Math.floor(probeT[i] / 86_400_000.0);
            double a = p.getOrDefault(key, 0.0);
            double b = p.getOrDefault(key - 1, 0.0);
            out[i] = a > 0.1 || b > 0.1;
        }
        return out;
    }

    private double[] acf(double[] x, int lags) {
        double[] out = new double[lags + 1];
        double mean = Stats.mean(x);
        if (!fin(mean)) return out;
        double var = 0;
        int n = 0;
        for (double v : x) if (fin(v)) { var += (v - mean) * (v - mean); n++; }
        if (var == 0) return out;
        for (int k = 0; k <= lags; k++) {
            double s = 0;
            int c = 0;
            for (int i = k; i < x.length; i++) {
                if (fin(x[i]) && fin(x[i - k])) {
                    s += (x[i] - mean) * (x[i - k] - mean);
                    c++;
                }
            }
            out[k] = c == 0 ? Double.NaN : s / var;
        }
        return out;
    }
}
