package com.sflab.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.sflab.engine.Stats.fin;

public final class Downsample {
    private Downsample() {}

    public static Map<String, Object> minMax(long[] t, Map<String, double[]> series, Long from, Long to, int maxPoints) {
        int n = t.length;
        int a = 0, b = n - 1;
        if (from != null) while (a < n && t[a] < from) a++;
        if (to != null) while (b > a && t[b] > to) b--;
        int len = Math.max(0, b - a + 1);
        List<String> names = new ArrayList<>(series.keySet());
        if (len <= maxPoints) {
            return pack(t, series, names, a, b, 1);
        }
        int buckets = Math.max(2, maxPoints / 2);
        double width = len / (double) buckets;
        List<Integer> keep = new ArrayList<>();
        for (int k = 0; k < buckets; k++) {
            int lo = a + (int) Math.floor(k * width);
            int hi = Math.min(b, a + (int) Math.floor((k + 1) * width) - 1);
            if (lo > hi) continue;
            int imin = lo, imax = lo, idiff = lo;
            double vmin = Double.POSITIVE_INFINITY, vmax = Double.NEGATIVE_INFINITY, dmax = -1;
            double[] y = series.get(names.get(0));
            for (int i = lo; i <= hi; i++) {
                if (y == null || !fin(y[i])) continue;
                if (y[i] < vmin) { vmin = y[i]; imin = i; }
                if (y[i] > vmax) { vmax = y[i]; imax = i; }
                for (int s = 1; s < names.size(); s++) {
                    double[] z = series.get(names.get(s));
                    if (z == null || i >= z.length || !fin(z[i])) continue;
                    double d = Math.abs(z[i] - y[i]);
                    if (d > dmax) { dmax = d; idiff = i; }
                }
            }
            keep.add(imin);
            if (imax != imin) keep.add(imax);
            if (dmax > 0 && idiff != imin && idiff != imax) keep.add(idiff);
        }
        return packIdx(t, series, names, keep);
    }

    private static Map<String, Object> pack(long[] t, Map<String, double[]> series, List<String> names, int a, int b, int step) {
        List<Integer> idx = new ArrayList<>();
        for (int i = a; i <= b; i += step) idx.add(i);
        return packIdx(t, series, names, idx);
    }

    private static Map<String, Object> packIdx(long[] t, Map<String, double[]> series, List<String> names, List<Integer> idx) {
        Map<String, Object> out = new LinkedHashMap<>();
        long[] tt = new long[idx.size()];
        for (int i = 0; i < idx.size(); i++) tt[i] = t[idx.get(i)];
        out.put("t", tt);
        Map<String, double[]> ys = new LinkedHashMap<>();
        for (String name : names) {
            double[] src = series.get(name);
            double[] y = new double[idx.size()];
            for (int i = 0; i < idx.size(); i++) y[i] = src == null || idx.get(i) >= src.length ? Double.NaN : src[idx.get(i)];
            ys.put(name, y);
        }
        out.put("series", ys);
        out.put("n", idx.size());
        return out;
    }
}
