package com.sflab.engine;

import com.sflab.model.Const;
import com.sflab.model.Tables;

import static com.sflab.engine.Stats.fin;
import static com.sflab.engine.Stats.falses;
import static com.sflab.engine.Stats.missing;
import static com.sflab.engine.Stats.rollingMedian;
import static com.sflab.engine.Stats.mad;

public class QcEngine {

    public static class WeightFlags {
        public boolean[] missingW, irregular, spike, step, bottle, wind, wall;
        public boolean[] overload, pump, gapPower, aboveNominal;
        public boolean[] inferredPump, rainlessJump;
    }

    public static class ProbeFlags {
        public boolean[][] mpsSat = new boolean[3][];
        public boolean[][] mpsRange = new boolean[3][];
        public boolean[][] vwcRange = new boolean[3][];
        public boolean[][] ecRange = new boolean[3][];
        public boolean[][] tempRange = new boolean[3][];
        public boolean[] vtensAir, feedbackBand, feedbackGap, sentinel;
        public boolean[] orphanVwc, diurnalT, inversion, hfWiggle;
    }

    public WeightFlags weight(Tables.Weight w, double[] tempOnWeight) {
        int n = w.n();
        WeightFlags f = new WeightFlags();
        f.missingW = falses(n);
        f.irregular = falses(n);
        f.spike = falses(n);
        f.step = falses(n);
        f.bottle = falses(n);
        f.wind = falses(n);
        f.wall = falses(n);
        f.overload = falses(n);
        f.aboveNominal = falses(n);
        f.pump = falses(n);
        f.gapPower = falses(n);
        f.wall = falses(n);
        f.inferredPump = falses(n);
        f.rainlessJump = falses(n);
        for (int i = 0; i < n; i++) {
            f.missingW[i] = missing(w.lyw[i]);
            f.overload[i] = fin(w.lyw[i]) && (w.lyw[i] < 0 || w.lyw[i] > 300);
            f.aboveNominal[i] = fin(w.lyw[i]) && w.lyw[i] > 75 && w.lyw[i] <= 300;
            double pin = fin(w.pumpIn[i]) ? w.pumpIn[i] : 0;
            double pout = fin(w.pumpOut[i]) ? w.pumpOut[i] : 0;
            f.pump[i] = pin + pout > 0;
        }
        for (int i = 1; i < n; i++) {
            if (w.t[i] - w.t[i - 1] > 90_000L) f.irregular[i] = true;
        }
        double[] med = rollingMedian(w.lyw, 11, 5, true);
        double[] resid = new double[n];
        for (int i = 0; i < n; i++) resid[i] = fin(w.lyw[i]) && fin(med[i]) ? w.lyw[i] - med[i] : Double.NaN;
        double scaleMad = mad(resid);
        double spikeThr = Math.max(0.008, fin(scaleMad) ? 4 * scaleMad : 0.008);
        for (int i = 1; i < n - 1; i++) {
            if (!fin(resid[i])) continue;
            double nb = Math.max(fin(resid[i - 1]) ? Math.abs(resid[i - 1]) : 0,
                    fin(resid[i + 1]) ? Math.abs(resid[i + 1]) : 0);
            if (Math.abs(resid[i]) >= spikeThr && nb < 0.55 * Math.abs(resid[i])) f.spike[i] = true;
        }
        double[] slow = rollingMedian(w.lyw, 5, 3, true);
        for (int i = 1; i < n; i++) {
            if (fin(slow[i]) && fin(slow[i - 1]) && Math.abs(slow[i] - slow[i - 1]) > 0.03) f.step[i] = true;
        }
        double[] slowB = rollingMedian(w.sww, 5, 3, true);
        for (int i = 1; i < n; i++) {
            if (fin(slowB[i]) && fin(slowB[i - 1]) && Math.abs(slowB[i] - slowB[i - 1]) > 0.05) f.bottle[i] = true;
        }
        double[] d1 = new double[n];
        for (int i = 1; i < n; i++) d1[i] = fin(w.lyw[i]) && fin(w.lyw[i - 1]) ? w.lyw[i] - w.lyw[i - 1] : Double.NaN;
        boolean[] windRaw = falses(n);
        for (int i = 0; i < n; i++) {
            int a = Math.max(0, i - 9);
            int c = 0;
            double s = 0, s2 = 0, abs = 0, peak = 0;
            for (int j = a; j <= i; j++) {
                if (!fin(d1[j])) continue;
                s += d1[j];
                s2 += d1[j] * d1[j];
                abs += Math.abs(d1[j]);
                peak = Math.max(peak, Math.abs(d1[j]));
                c++;
            }
            if (c < 8) continue;
            double mean = s / c;
            double std = Math.sqrt(Math.max(0, (s2 - c * mean * mean) / (c - 1)));
            windRaw[i] = std > 0.008 && (abs / c) < 0.005 && peak < 0.10;
        }
        for (int i = 0; i < n; i++) {
            if (!windRaw[i]) continue;
            int hit = 0;
            for (int j = Math.max(0, i - 2); j <= Math.min(n - 1, i + 2); j++) if (windRaw[j]) hit++;
            f.wind[i] = hit >= 3;
            if (f.wind[i]) f.spike[i] = false;
        }
        if (tempOnWeight != null && tempOnWeight.length == n) {
            f.wall = thermalWall(w.lyw, tempOnWeight);
        }
        return f;
    }

    public ProbeFlags probe(Tables.Probe p) {
        int n = p.n();
        ProbeFlags f = new ProbeFlags();
        f.vtensAir = falses(n);
        f.feedbackBand = falses(n);
        f.feedbackGap = falses(n);
        f.sentinel = falses(n);
        f.orphanVwc = falses(n);
        f.diurnalT = falses(n);
        f.inversion = falses(n);
        f.hfWiggle = falses(n);
        for (int d = 0; d < 3; d++) {
            f.mpsSat[d] = falses(n);
            f.mpsRange[d] = falses(n);
            f.vwcRange[d] = falses(n);
            f.ecRange[d] = falses(n);
            f.tempRange[d] = falses(n);
            for (int i = 0; i < n; i++) {
                double mps = p.mps[d][i];
                if (!fin(mps) || Math.abs(mps) >= 9000) {
                    f.mpsRange[d][i] = true;
                } else {
                    if (mps > -10) f.mpsSat[d][i] = true;
                    if (mps < -500) f.mpsRange[d][i] = true;
                }
                double vwc = p.echo[d][i];
                if (fin(vwc) && (vwc < 0 || vwc > 70)) f.vwcRange[d][i] = true;
                double ec = p.ec[d][i];
                if (fin(ec) && (ec < 0 || ec > 23)) f.ecRange[d][i] = true;
                double tp = p.temp[d][i];
                if (fin(tp) && (tp < -40 || tp > 50)) f.tempRange[d][i] = true;
            }
        }
        for (int i = 0; i < n; i++) {
            double v = p.vtens[i];
            double recent = 0;
            for (int k = Math.max(0, i - 30); k < i; k++) if (fin(p.vtens[k])) recent = Math.max(recent, Math.abs(p.vtens[k]));
            boolean near = fin(v) && Math.abs(v) >= 75;
            boolean collapsed = fin(v) && Math.abs(v) <= 5 && recent >= 50;
            f.vtensAir[i] = near || collapsed;
            if (fin(v) && (v > 3 || v < -70) && !f.vtensAir[i]) f.feedbackBand[i] = true;
        }
        for (int i = 0; i < n; i++) {
            int a = Math.max(0, i - 29);
            int c = 0;
            double[] buf = new double[30];
            for (int k = a; k <= i; k++) {
                if (fin(p.vtens[k]) && fin(p.refTens[k]) && !f.vtensAir[k]) {
                    buf[c++] = Math.abs(p.vtens[k] - p.refTens[k]);
                }
            }
            if (c >= 10) {
                java.util.Arrays.sort(buf, 0, c);
                double med = c % 2 == 1 ? buf[c / 2] : 0.5 * (buf[c / 2 - 1] + buf[c / 2]);
                if (med > 5) f.feedbackGap[i] = true;
            }
        }
        return f;
    }

    public byte[] weightGrade(WeightFlags f) {
        int n = f.missingW.length;
        byte[] g = new byte[n];
        for (int i = 0; i < n; i++) {
            if (f.missingW[i] || f.spike[i] || f.overload[i]) g[i] = 2;
            else if (f.wind[i] || f.wall[i] || f.step[i] || f.bottle[i] || f.pump[i] || f.irregular[i]
                    || f.inferredPump[i] || f.rainlessJump[i]) g[i] = 1;
            else g[i] = 0;
        }
        return g;
    }

    public byte[] probeGrade(ProbeFlags f) {
        int n = f.sentinel.length;
        int gapN = 0, bandN = 0;
        for (boolean b : f.feedbackGap) if (b) gapN++;
        for (boolean b : f.feedbackBand) if (b) bandN++;
        boolean gapChronic = gapN > 200;
        boolean bandChronic = n > 0 && bandN > 0.5 * n;
        boolean[] mpsChronic = new boolean[3];
        for (int d = 0; d < 3; d++) {
            int c = 0;
            for (int i = 0; i < n; i++) if (f.mpsRange[d][i]) c++;
            mpsChronic[d] = c > 0.5 * n;
        }
        byte[] g = new byte[n];
        for (int i = 0; i < n; i++) {
            boolean err = f.sentinel[i];
            boolean sus = f.vtensAir[i]
                    || f.orphanVwc[i] || f.diurnalT[i] || f.inversion[i] || f.hfWiggle[i];
            if (!bandChronic) sus = sus || f.feedbackBand[i];
            if (!gapChronic) sus = sus || f.feedbackGap[i];
            for (int d = 0; d < 3; d++) {
                err = err || f.vwcRange[d][i] || f.ecRange[d][i] || f.tempRange[d][i];
                sus = sus || f.mpsSat[d][i] || (!mpsChronic[d] && f.mpsRange[d][i]);
            }
            if (err) g[i] = 2;
            else if (sus) g[i] = 1;
            else g[i] = 0;
        }
        return g;
    }

    private boolean[] thermalWall(double[] y, double[] z) {
        int win = 360;
        int n = y.length;
        boolean[] out = falses(n);
        if (n < win) return out;
        int half = win / 2;
        double[] t = new double[win];
        double tvar = 0;
        double meanT = (win - 1) / 2.0;
        for (int i = 0; i < win; i++) {
            t[i] = i - meanT;
            tvar += t[i] * t[i];
        }
        int step = Math.max(1, n > 8000 ? 8 : 1);
        for (int s = 0; s <= n - win; s += step) {
            boolean ok = true;
            double ymin = Double.POSITIVE_INFINITY, ymax = Double.NEGATIVE_INFINITY, my = 0, mz = 0;
            for (int k = 0; k < win; k++) {
                double yy = y[s + k], zz = z[s + k];
                if (!fin(yy) || !fin(zz)) { ok = false; break; }
                ymin = Math.min(ymin, yy);
                ymax = Math.max(ymax, yy);
                my += yy;
                mz += zz;
            }
            if (!ok) continue;
            my /= win;
            mz /= win;
            double by = 0, bz = 0;
            for (int k = 0; k < win; k++) {
                by += (y[s + k] - my) * t[k];
                bz += (z[s + k] - mz) * t[k];
            }
            by /= tvar;
            bz /= tvar;
            double num = 0, syy = 0, szz = 0;
            for (int k = 0; k < win; k++) {
                double ry = y[s + k] - my - by * t[k];
                double rz = z[s + k] - mz - bz * t[k];
                num += ry * rz;
                syy += ry * ry;
                szz += rz * rz;
            }
            double den = Math.sqrt(syy * szz);
            double corr = den > 0 ? num / den : 0;
            double spread = Math.sqrt(syy / win);
            double tspread = Math.sqrt(szz / win);
            boolean hit = Math.abs(corr) >= 0.8 && spread >= 0.004 && spread <= 0.04
                    && ymax - ymin <= 0.5 && tspread >= 0.15;
            if (hit) {
                for (int k = 0; k < step && s + half + k < n; k++) out[s + half + k] = true;
            }
        }
        return out;
    }

    /**
     * Prefer over-flagging: unexplained VWC wiggles without lysimeter P,
     * dielectric-temperature coupling, layer-order inversion, complementary LYW/SWW as pump.
     */
    public void physical(Tables.Weight w, Tables.Probe p, WeightFlags wf, ProbeFlags pf) {
        if (w != null && wf != null) {
            inferPump(w, wf);
            rainlessMass(w, wf);
        }
        if (p == null || pf == null || p.n() < 8) return;
        boolean[] rainNear = rainNearProbe(w, p.t, 4 * 3600_000L, 6 * 3600_000L);
        orphanAndWiggle(p, pf, rainNear);
        diurnalDielectric(p, pf, rainNear);
        layerInversion(p, pf);
    }

    private void inferPump(Tables.Weight w, WeightFlags wf) {
        int n = w.n();
        for (int i = 1; i < n; i++) {
            if (!fin(w.lyw[i]) || !fin(w.lyw[i - 1]) || !fin(w.sww[i]) || !fin(w.sww[i - 1])) continue;
            double dL = w.lyw[i] - w.lyw[i - 1];
            double dS = w.sww[i] - w.sww[i - 1];
            if (Math.abs(dL) < 0.02) continue;
            if (dL * dS < 0 && Math.abs(dL + dS) < 0.35 * Math.abs(dL)) {
                wf.inferredPump[i] = true;
            }
        }
    }

    private void rainlessMass(Tables.Weight w, WeightFlags wf) {
        int n = w.n();
        for (int i = 1; i < n - 20; i++) {
            if (!fin(w.lyw[i]) || !fin(w.lyw[i - 1])) continue;
            double d = w.lyw[i] - w.lyw[i - 1];
            if (Math.abs(d) < Const.MASS_GATE_KG) continue;
            if (wf.pump[i] || wf.inferredPump[i] || wf.spike[i]) continue;
            int j = Math.min(n - 1, i + 20);
            if (!fin(w.lyw[j])) continue;
            double back = w.lyw[j] - w.lyw[i];
            if (Math.abs(d + back) < 0.4 * Math.abs(d) && Math.abs(w.lyw[j] - w.lyw[i - 1]) < 0.6 * Math.abs(d)) {
                wf.rainlessJump[i] = true;
            }
        }
    }

    private boolean[] rainNearProbe(Tables.Weight w, long[] pt, long before, long after) {
        boolean[] near = falses(pt.length);
        if (w == null || w.n() < 2) return near;
        int j = 0;
        for (int i = 1; i < w.n(); i++) {
            if (!fin(w.lyw[i]) || !fin(w.lyw[i - 1])) continue;
            if (w.lyw[i] - w.lyw[i - 1] < Const.MASS_GATE_KG) continue;
            long t0 = w.t[i] - before;
            long t1 = w.t[i] + after;
            while (j < pt.length && pt[j] < t0) j++;
            int k = j;
            while (k < pt.length && pt[k] <= t1) {
                near[k] = true;
                k++;
            }
        }
        return near;
    }

    private void orphanAndWiggle(Tables.Probe p, ProbeFlags pf, boolean[] rainNear) {
        int n = p.n();
        double[] e = p.echo[0];
        double[] tp = p.temp[0];
        for (int i = 1; i < n; i++) {
            if (!fin(e[i]) || !fin(e[i - 1])) continue;
            double d = e[i] - e[i - 1];
            boolean rain = rainNear[i] || rainNear[i - 1];
            if (d >= 0.25 && !rain) pf.orphanVwc[i] = true;
            if (Math.abs(d) >= 0.12 && !rain) {
                double dT = (fin(tp[i]) && fin(tp[i - 1])) ? Math.abs(tp[i] - tp[i - 1]) : 0;
                if (dT < 0.25) pf.hfWiggle[i] = true;
            }
        }
        for (int i = 6; i < n; i++) {
            if (!fin(e[i]) || !fin(e[i - 6])) continue;
            boolean rain = false;
            for (int k = i - 6; k <= i; k++) if (rainNear[k]) { rain = true; break; }
            if (!rain && e[i] - e[i - 6] >= 0.8) {
                for (int k = i - 6; k <= i; k++) pf.orphanVwc[k] = true;
            }
        }
    }

    private void diurnalDielectric(Tables.Probe p, ProbeFlags pf, boolean[] rainNear) {
        int n = p.n();
        int i = 0;
        while (i < n) {
            long day0 = (p.t[i] / 86_400_000L) * 86_400_000L;
            int j = i;
            while (j < n && p.t[j] < day0 + 86_400_000L) j++;
            boolean rain = false;
            for (int k = i; k < j; k++) if (rainNear[k]) { rain = true; break; }
            if (!rain && j - i >= 12) {
                double c = corr(p.echo[0], p.temp[0], i, j);
                double r = range(p.echo[0], i, j);
                if (fin(c) && Math.abs(c) >= 0.45 && r >= 0.35) {
                    for (int k = i; k < j; k++) {
                        int h = (int) ((p.t[k] % 86_400_000L) / 3600_000L);
                        if (h >= 7 && h <= 17) pf.diurnalT[k] = true;
                    }
                }
            }
            i = j;
        }
    }

    private void layerInversion(Tables.Probe p, ProbeFlags pf) {
        int n = p.n();
        int lag = 6;
        for (int i = lag; i < n; i++) {
            if (!fin(p.echo[0][i]) || !fin(p.echo[0][i - lag])) continue;
            double d1 = p.echo[0][i] - p.echo[0][i - lag];
            double d2 = fin(p.echo[1][i]) && fin(p.echo[1][i - lag]) ? p.echo[1][i] - p.echo[1][i - lag] : 0;
            double d3 = fin(p.echo[2][i]) && fin(p.echo[2][i - lag]) ? p.echo[2][i] - p.echo[2][i - lag] : 0;
            if (d3 >= 0.7 && d1 < 0.2) pf.inversion[i] = true;
            if (d2 >= 0.8 && d1 < 0.15) pf.inversion[i] = true;
        }
    }

    private double corr(double[] a, double[] b, int lo, int hi) {
        double sa = 0, sb = 0;
        int c = 0;
        for (int i = lo; i < hi; i++) {
            if (!fin(a[i]) || !fin(b[i])) continue;
            sa += a[i];
            sb += b[i];
            c++;
        }
        if (c < 8) return Double.NaN;
        double ma = sa / c, mb = sb / c, num = 0, va = 0, vb = 0;
        for (int i = lo; i < hi; i++) {
            if (!fin(a[i]) || !fin(b[i])) continue;
            double da = a[i] - ma, db = b[i] - mb;
            num += da * db;
            va += da * da;
            vb += db * db;
        }
        double den = Math.sqrt(va * vb);
        return den > 0 ? num / den : Double.NaN;
    }

    private double range(double[] y, int lo, int hi) {
        double mn = Double.POSITIVE_INFINITY, mx = Double.NEGATIVE_INFINITY;
        for (int i = lo; i < hi; i++) {
            if (!fin(y[i])) continue;
            mn = Math.min(mn, y[i]);
            mx = Math.max(mx, y[i]);
        }
        return mx >= mn ? mx - mn : 0;
    }
}
