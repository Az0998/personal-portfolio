package com.sflab.engine;

import com.sflab.model.Const;

import static com.sflab.engine.Stats.fin;
import static com.sflab.engine.Stats.nans;
import static com.sflab.engine.Stats.roundOdd;

/**
 * Weight-series filters for teaching: moving average, linear interpolation of gaps,
 * and AWAT (Peters: adaptive window + adaptive threshold) with optional snap / interpolators.
 */
public class FilterEngine {

    public static class Result {
        public String method;
        public double[] rawMm;
        public double[] filteredMm;
        public boolean[] anchor;
        public java.util.List<String> notes = new java.util.ArrayList<>();
    }

    public Result run(double[] sysKg, boolean[] drop, String method, int maWin, int wmax, double dmaxMm,
                      boolean snap, String interp) {
        Result r = new Result();
        r.method = method == null ? "NONE" : method.toUpperCase();
        int n = sysKg.length;
        r.rawMm = nans(n);
        for (int i = 0; i < n; i++) {
            if (fin(sysKg[i]) && (drop == null || !drop[i])) r.rawMm[i] = sysKg[i] * Const.MM_PER_KG;
        }
        switch (r.method) {
            case "MA" -> r.filteredMm = movingAverage(r.rawMm, Math.max(3, maWin | 1));
            case "LINEAR" -> r.filteredMm = linearFill(r.rawMm);
            case "AWAT" -> {
                Awat a = awat(r.rawMm, Math.max(3, wmax | 1), Math.max(0.16, dmaxMm), snap, interp);
                r.filteredMm = a.y;
                r.anchor = a.anchor;
                r.notes.add("AWAT：wmin=1 min，wmax=" + (wmax | 1) + " min，δmax=" + dmaxMm + " mm（Peters；处理笔记 3.2）。");
                if (snap) r.notes.add("已启用 snap：通量换向时在滑动平均极值处加定位点。");
            }
            default -> {
                r.filteredMm = r.rawMm.clone();
                r.notes.add("未滤波，仅去掉已标记的尖峰/风振/泵脉冲。");
            }
        }
        if (r.method.equals("MA")) r.notes.add("滑动平均窗口 " + (maWin | 1) + " min。适合演示降噪，雨强会被抹平。");
        if (r.method.equals("LINEAR")) r.notes.add("对缺测与剔除点线性插值。突变降雨段不要单独用它代替 AWAT。");
        return r;
    }

    public static double[] movingAverage(double[] y, int win) {
        int n = y.length;
        double[] out = nans(n);
        int half = win / 2;
        for (int i = 0; i < n; i++) {
            double s = 0;
            int c = 0;
            for (int j = Math.max(0, i - half); j <= Math.min(n - 1, i + half); j++) {
                if (fin(y[j])) { s += y[j]; c++; }
            }
            if (c > 0) out[i] = s / c;
        }
        return out;
    }

    public static double[] linearFill(double[] y) {
        int n = y.length;
        double[] out = y.clone();
        int i = 0;
        while (i < n) {
            if (fin(out[i])) { i++; continue; }
            int j = i;
            while (j < n && !fin(out[j])) j++;
            int L = i - 1;
            int R = j;
            if (L >= 0 && R < n && fin(out[L]) && fin(out[R])) {
                for (int k = i; k < R; k++) {
                    double u = (k - L) / (double) (R - L);
                    out[k] = out[L] * (1 - u) + out[R] * u;
                }
            }
            i = j;
        }
        return out;
    }

    private static class Awat {
        double[] y;
        boolean[] anchor;
    }

    private Awat awat(double[] y, int wmax, double dmax, boolean snap, String interp) {
        int n = y.length;
        int wmin = 1;
        double[] ma = nans(n);
        double[] sres = nans(n);
        int[] w = new int[n];
        int half = wmax / 2;
        int stride = n > 8000 ? 5 : 1;
        for (int i = 0; i < n; i += stride) {
            int a = Math.max(0, i - half);
            int b = Math.min(n - 1, i + half);
            double[] xv = new double[b - a + 1];
            double[] yv = new double[b - a + 1];
            int c = 0;
            for (int j = a; j <= b; j++) {
                if (!fin(y[j])) continue;
                xv[c] = j - i;
                yv[c] = y[j];
                c++;
            }
            if (c < 5) continue;
            Fit best = bestPoly(xv, yv, c);
            double b0 = varExplained(yv, c);
            double bi = b0 <= 1e-12 ? 0 : Math.max(0, Math.min(1, 1 - best.ssq / b0));
            w[i] = Math.min(wmax, Math.max(wmin, roundOdd(wmax - bi * (wmax - wmin))));
            sres[i] = Math.sqrt(best.ssq / Math.max(1, c));
        }
        for (int i = 0; i < n; i++) {
            if (w[i] == 0) {
                int lo = i - (i % stride);
                int hi = Math.min(n - 1, lo + stride);
                w[i] = w[lo] != 0 ? w[lo] : (w[hi] != 0 ? w[hi] : wmax);
                sres[i] = fin(sres[lo]) ? sres[lo] : sres[hi];
            }
        }
        for (int i = 0; i < n; i++) {
            int wi = w[i] <= 0 ? wmax : w[i];
            int h = wi / 2;
            double s = 0;
            int c = 0;
            for (int j = Math.max(0, i - h); j <= Math.min(n - 1, i + h); j++) {
                if (fin(y[j])) { s += y[j]; c++; }
            }
            if (c > 0) ma[i] = s / c;
        }
        double dmin = Const.MASS_GATE_MM;
        double[] delta = nans(n);
        for (int i = 0; i < n; i++) {
            double noise = fin(sres[i]) ? 1.96 * sres[i] : dmin;
            delta[i] = Math.max(dmin, Math.min(dmax, noise));
        }
        double[] stepped = nans(n);
        boolean[] anchor = new boolean[n];
        Double last = null;
        for (int i = 0; i < n; i++) {
            if (!fin(ma[i])) continue;
            double thr = fin(delta[i]) ? delta[i] : dmin;
            if (last == null || Math.abs(ma[i] - last) >= thr) {
                last = ma[i];
                anchor[i] = true;
            }
            stepped[i] = last;
        }
        if (snap) extraAnchors(ma, stepped, anchor);
        double[] out = switch (interp == null ? "STEP" : interp.toUpperCase()) {
            case "HERMITE" -> hermite(stepped, anchor);
            case "LINEAR" -> interpolateAnchors(ma, anchor);
            default -> stepped;
        };
        Awat a = new Awat();
        a.y = out;
        a.anchor = anchor;
        return a;
    }

    private void extraAnchors(double[] ma, double[] stepped, boolean[] anchor) {
        int n = ma.length;
        java.util.List<Integer> idx = new java.util.ArrayList<>();
        for (int i = 0; i < n; i++) if (anchor[i]) idx.add(i);
        for (int k = 0; k < idx.size() - 1; k++) {
            int a = idx.get(k), b = idx.get(k + 1);
            if (b - a < 4 || !fin(ma[a]) || !fin(ma[b])) continue;
            int ext = a;
            boolean up = ma[b] > ma[a];
            double best = ma[a];
            for (int i = a; i <= b; i++) {
                if (!fin(ma[i])) continue;
                if (up && ma[i] > best) { best = ma[i]; ext = i; }
                if (!up && ma[i] < best) { best = ma[i]; ext = i; }
            }
            if (ext != a && ext != b) {
                anchor[ext] = true;
                stepped[ext] = ma[ext];
            }
        }
    }

    private double[] interpolateAnchors(double[] ma, boolean[] anchor) {
        int n = ma.length;
        double[] out = nans(n);
        int prev = -1;
        for (int i = 0; i < n; i++) {
            if (!anchor[i] || !fin(ma[i])) continue;
            if (prev >= 0 && i > prev) {
                for (int k = prev; k <= i; k++) {
                    double u = (k - prev) / (double) (i - prev);
                    out[k] = ma[prev] * (1 - u) + ma[i] * u;
                }
            } else out[i] = ma[i];
            prev = i;
        }
        if (prev >= 0) {
            for (int i = 0; i < n; i++) if (!fin(out[i]) && fin(ma[i])) out[i] = ma[i];
        }
        return out;
    }

    private double[] hermite(double[] stepped, boolean[] anchor) {
        double[] y = interpolateAnchors(stepped, anchor);
        int n = y.length;
        double[] out = y.clone();
        for (int i = 1; i < n - 1; i++) {
            if (fin(y[i - 1]) && fin(y[i]) && fin(y[i + 1])) {
                out[i] = 0.25 * y[i - 1] + 0.5 * y[i] + 0.25 * y[i + 1];
            }
        }
        return out;
    }

    private static class Fit {
        double ssq;
    }

    private Fit bestPoly(double[] x, double[] y, int n) {
        Fit best = new Fit();
        best.ssq = Double.POSITIVE_INFINITY;
        double bestAicc = Double.POSITIVE_INFINITY;
        int maxK = Math.min(6, n - 2);
        for (int k = 0; k <= maxK; k++) {
            double ssq = polySsq(x, y, n, k);
            int p = k + 1;
            if (n <= p + 1) continue;
            double aicc = n * Math.log(Math.max(ssq, 1e-18) / n) + 2 * p + 2.0 * p * (p + 1) / (n - p - 1);
            if (aicc < bestAicc) {
                bestAicc = aicc;
                best.ssq = ssq;
            }
        }
        if (!Double.isFinite(best.ssq)) best.ssq = varExplained(y, n);
        return best;
    }

    private double varExplained(double[] y, int n) {
        double m = 0;
        for (int i = 0; i < n; i++) m += y[i];
        m /= n;
        double s = 0;
        for (int i = 0; i < n; i++) s += (y[i] - m) * (y[i] - m);
        return s;
    }

    private double polySsq(double[] x, double[] y, int n, int k) {
        int p = k + 1;
        double[][] A = new double[p][p];
        double[] b = new double[p];
        for (int i = 0; i < n; i++) {
            double xp = 1;
            double[] pow = new double[p];
            for (int j = 0; j < p; j++) {
                pow[j] = xp;
                xp *= x[i];
            }
            for (int r = 0; r < p; r++) {
                b[r] += pow[r] * y[i];
                for (int c = 0; c < p; c++) A[r][c] += pow[r] * pow[c];
            }
        }
        double[] coef = solve(A, b);
        if (coef == null) return varExplained(y, n);
        double ssq = 0;
        for (int i = 0; i < n; i++) {
            double yp = 0, xp = 1;
            for (int j = 0; j < p; j++) {
                yp += coef[j] * xp;
                xp *= x[i];
            }
            double e = y[i] - yp;
            ssq += e * e;
        }
        return ssq;
    }

    private double[] solve(double[][] A, double[] b) {
        int n = b.length;
        double[][] M = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, M[i], 0, n);
            M[i][n] = b[i];
        }
        for (int i = 0; i < n; i++) {
            int piv = i;
            for (int r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[piv][i])) piv = r;
            double[] tmp = M[i];
            M[i] = M[piv];
            M[piv] = tmp;
            if (Math.abs(M[i][i]) < 1e-12) return null;
            double div = M[i][i];
            for (int c = i; c <= n; c++) M[i][c] /= div;
            for (int r = 0; r < n; r++) if (r != i) {
                double f = M[r][i];
                for (int c = i; c <= n; c++) M[r][c] -= f * M[i][c];
            }
        }
        double[] x = new double[n];
        for (int i = 0; i < n; i++) x[i] = M[i][n];
        return x;
    }
}
