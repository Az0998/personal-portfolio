package com.sflab.engine;

import java.util.Arrays;

public final class Stats {
    private Stats() {}

    public static boolean fin(double v) {
        return Double.isFinite(v);
    }

    public static boolean missing(double v) {
        return !fin(v) || Math.abs(v) >= 9000;
    }

    public static double[] nans(int n) {
        double[] a = new double[n];
        Arrays.fill(a, Double.NaN);
        return a;
    }

    public static boolean[] falses(int n) {
        return new boolean[n];
    }

    public static double median(double[] xs) {
        int c = 0;
        for (double v : xs) if (fin(v)) c++;
        if (c == 0) return Double.NaN;
        double[] b = new double[c];
        int k = 0;
        for (double v : xs) if (fin(v)) b[k++] = v;
        Arrays.sort(b);
        return c % 2 == 1 ? b[c / 2] : 0.5 * (b[c / 2 - 1] + b[c / 2]);
    }

    public static double mad(double[] xs) {
        double m = median(xs);
        if (!fin(m)) return Double.NaN;
        double[] d = new double[xs.length];
        for (int i = 0; i < xs.length; i++) d[i] = fin(xs[i]) ? Math.abs(xs[i] - m) : Double.NaN;
        return median(d);
    }

    public static double[] rollingMedian(double[] arr, int win, int minP, boolean center) {
        int n = arr.length;
        double[] out = nans(n);
        int half = win / 2;
        double[] buf = new double[win];
        for (int i = 0; i < n; i++) {
            int a = center ? i - half : i - win + 1;
            int b = center ? i + half : i;
            int c = 0;
            for (int j = Math.max(0, a); j <= Math.min(n - 1, b); j++) {
                if (fin(arr[j])) buf[c++] = arr[j];
            }
            if (c < minP) continue;
            Arrays.sort(buf, 0, c);
            out[i] = c % 2 == 1 ? buf[c / 2] : 0.5 * (buf[c / 2 - 1] + buf[c / 2]);
        }
        return out;
    }

    public static double[] holdLast(double[] arr) {
        double[] out = arr.clone();
        double last = Double.NaN;
        for (int i = 0; i < out.length; i++) {
            if (fin(out[i])) last = out[i];
            else if (fin(last)) out[i] = last;
        }
        return out;
    }

    public static double[] withoutSteps(double[] arr, double jumpKg) {
        double[] slow = rollingMedian(arr, 5, 3, true);
        double[] jumpAt = new double[arr.length];
        for (int i = 1; i < arr.length; i++) {
            if (!fin(slow[i]) || !fin(slow[i - 1])) continue;
            double jump = slow[i] - slow[i - 1];
            if (Math.abs(jump) <= jumpKg) continue;
            int j = Math.min(arr.length - 1, i + 15);
            if (!fin(slow[j]) || Math.abs(slow[j] - slow[i - 1]) <= jumpKg) continue;
            jumpAt[i] = jump;
        }
        double[] out = arr.clone();
        double acc = 0;
        for (int i = 0; i < out.length; i++) {
            acc += jumpAt[i];
            if (fin(out[i])) out[i] -= acc;
        }
        return out;
    }

    public static double[] interpTo(long[] srcT, double[] srcV, long[] dstT) {
        double[] out = nans(dstT.length);
        if (srcT.length == 0) return out;
        int j = 0;
        for (int i = 0; i < dstT.length; i++) {
            long t = dstT[i];
            while (j + 1 < srcT.length && srcT[j + 1] <= t) j++;
            if (srcT[j] == t && fin(srcV[j])) {
                out[i] = srcV[j];
                continue;
            }
            if (j + 1 < srcT.length && fin(srcV[j]) && fin(srcV[j + 1]) && srcT[j + 1] > srcT[j]) {
                double u = (t - srcT[j]) / (double) (srcT[j + 1] - srcT[j]);
                if (u >= 0 && u <= 1) out[i] = srcV[j] * (1 - u) + srcV[j + 1] * u;
            } else if (Math.abs(srcT[j] - t) <= 15 * 60_000L && fin(srcV[j])) {
                out[i] = srcV[j];
            }
        }
        return out;
    }

    public static int[] dayIndex(long[] t) {
        int[] d = new int[t.length];
        for (int i = 0; i < t.length; i++) d[i] = (int) Math.floor(t[i] / 86_400_000.0);
        return d;
    }

    public static double mean(double[] xs) {
        double s = 0;
        int c = 0;
        for (double v : xs) if (fin(v)) { s += v; c++; }
        return c == 0 ? Double.NaN : s / c;
    }

    public static double pearson(double[] a, double[] b) {
        if (a == null || b == null) return Double.NaN;
        int n = Math.min(a.length, b.length);
        double sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
        int c = 0;
        for (int i = 0; i < n; i++) {
            if (!fin(a[i]) || !fin(b[i])) continue;
            sx += a[i];
            sy += b[i];
            sxx += a[i] * a[i];
            syy += b[i] * b[i];
            sxy += a[i] * b[i];
            c++;
        }
        if (c < 8) return Double.NaN;
        double num = c * sxy - sx * sy;
        double den = Math.sqrt((c * sxx - sx * sx) * (c * syy - sy * sy));
        return den < 1e-12 ? Double.NaN : num / den;
    }

    public static double maxAbs(double[] xs) {
        double m = Double.NaN;
        for (double v : xs) if (fin(v)) m = fin(m) ? Math.max(m, Math.abs(v)) : Math.abs(v);
        return m;
    }

    public static int roundOdd(double x) {
        int n = (int) Math.round(x);
        if (n < 1) n = 1;
        if (n % 2 == 0) n += 1;
        return n;
    }

    /** Through-origin OLS: y = a x. */
    public static double slopeOrigin(double[] x, double[] y, boolean[] use) {
        double num = 0, den = 0;
        for (int i = 0; i < x.length; i++) {
            if (use != null && !use[i]) continue;
            if (!fin(x[i]) || !fin(y[i])) continue;
            num += x[i] * y[i];
            den += x[i] * x[i];
        }
        return den == 0 ? Double.NaN : num / den;
    }

    public static double tQuantile99(int df) {
        if (df <= 1) return 63.66;
        if (df == 2) return 9.925;
        if (df == 3) return 5.841;
        if (df <= 5) return 4.032;
        if (df <= 10) return 3.169;
        if (df <= 20) return 2.845;
        if (df <= 30) return 2.750;
        if (df <= 60) return 2.660;
        if (df <= 120) return 2.617;
        return 2.576;
    }
}
