package com.sflab.engine;

import com.sflab.model.Const;
import com.sflab.model.Tables;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.sflab.engine.Stats.fin;
import static com.sflab.engine.Stats.pearson;

/** Short, data-driven read of Yuzhong Cuiying lysimeter curves. */
public final class MechanismEngine {
    private MechanismEngine() {}

    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(ZoneOffset.UTC);

    public static Map<String, Object> coverage(Tables.Weight w, Tables.Probe p, Tables.Weather z, String weatherNote) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("weight", span(w == null ? new long[0] : w.t, w == null ? new double[0] : w.lyw));
        out.put("probe", span(p == null ? new long[0] : p.t, p == null || p.n() == 0 ? new double[0] : p.echo[0]));
        out.put("weather", span(z == null ? new long[0] : z.t, z == null ? new double[0] : z.precip));
        boolean wp = overlap(w, p);
        boolean wz = overlap(w, z);
        boolean pz = overlap(p, z);
        out.put("weightProbe", wp);
        out.put("weightWeather", wz);
        out.put("probeWeather", pz);
        List<String> warns = new ArrayList<>();
        if (weatherNote != null && !weatherNote.isBlank()) warns.add(weatherNote);
        int pn = p == null ? 0 : p.n();
        int zn = z == null ? 0 : z.n();
        int wn = w == null ? 0 : w.n();
        if (pn == 0) warns.add("无探头：跳过 θ 订正与剖面。");
        if (zn == 0 && (weatherNote == null || weatherNote.isBlank())) warns.add("无气象：不做 ET0 / 雨量对照。");
        if (wn > 0 && zn > 0 && !wz) {
            warns.add("称重 " + rng(w.t) + " 与气象 " + rng(z.t) + " 无交集，雨量和 ET0 作废。");
        }
        if (wn > 0 && pn > 0 && !wp) {
            warns.add("称重 " + rng(w.t) + " 与探头 " + rng(p.t) + " 无交集，θ 不能解释质量。");
        }
        if (pn > 0 && zn > 0 && !pz) {
            warns.add("探头与气象无交集，α 不用雨掩膜。");
        }
        out.put("warnings", warns);
        return out;
    }

    public static List<String> lines(Tables.Weight w, Tables.Probe p, Tables.Weather z,
                                    QcEngine.WeightFlags wf, QcEngine.ProbeFlags pf,
                                    TempCorrectionEngine.Result temp, WaterBalanceEngine.Result bal,
                                    boolean demo) {
        List<String> out = new ArrayList<>();
        boolean wz = overlap(w, z);
        boolean wp = overlap(w, p);
        if (!demo && w != null && w.n() > 0) {
            int m = Instant.ofEpochMilli(w.t[0]).atZone(ZoneOffset.UTC).getMonthValue();
            if (m >= 9 && m <= 11) {
                out.add("榆中萃英山黄土旱作，秋末日较差大：浅层白天 θ 抬、夜间回，先当介电，不写入渗。");
            } else if (m >= 6 && m <= 8) {
                out.add("榆中萃英山盛夏：浅层应先湿；三层同跳多半是温度，不是锋面。");
            } else if (m == 12 || m <= 2) {
                out.add("榆中萃英山冬季：T≤0 不订正；质量起伏先看冻融和风，不看雨。");
            } else {
                out.add("榆中萃英山黄土剖面，浅层日较差大于深层。");
            }
        }
        if (w != null && w.n() > 1) {
            double first = firstFin(w.lyw);
            double last = lastFin(w.lyw);
            if (fin(first) && fin(last)) {
                double dmm = (last - first) * Const.MM_PER_KG;
                if (dmm < -2) out.add(String.format("土柱净失水 %.1f mm，旱作蒸散主导。", -dmm));
                else if (dmm > 2) out.add(String.format("土柱净增重 %.1f mm。%s", dmm, wz ? "对照气象雨量。" : "无同期雨量，不写成降水。"));
            }
            int pumps = countTrue(wf == null ? null : wf.pump) + countTrue(wf == null ? null : wf.inferredPump);
            if (pumps == 0) out.add("本段无泵柱，质量跳变不是内部调水。");
            int wind = countTrue(wf == null ? null : wf.wind);
            if (w.n() > 0 && wind > 0.02 * w.n()) out.add("风振点偏多，萃英山脊风把短时抖记进质量，不当雨。");
            if (!wz) out.add("过门限增重只作质量事件，不记降水。");
        }
        if (p != null && p.n() > 8) {
            double r = pearson(p.echo[0], p.temp[0]);
            double alpha = Double.NaN;
            if (temp != null && !temp.layers.isEmpty()) alpha = temp.layers.get(0).alpha;
            boolean dielectric = fin(r) && r >= 0.35;
            boolean alphaHit = fin(alpha) && alpha > 0.002;
            if (dielectric) {
                out.add(String.format("15 cm θ–土温 r=%.2f，同位相 → 介电假湿，订正对象。", r));
            } else if (!alphaHit && fin(r) && Math.abs(r) < 0.2) {
                out.add(String.format("15 cm θ–土温 r=%.2f，日周期弱。", r));
            }
            if (!wp) out.add("探头与称重错开，「无雨抬升」不能用称重证伪。");
            double a15 = diurnalAmp(p.t, p.echo[0]);
            double a55 = diurnalAmp(p.t, p.echo[2]);
            if (fin(a15) && fin(a55) && a15 > 1.6 * Math.max(a55, 0.15)) {
                out.add(demo
                    ? String.format("浅层日振幅 %.2f %% ≫ 深层 %.2f %%。", a15, a55)
                    : String.format("浅层日振幅 %.2f %% ≫ 深层 %.2f %%，符合黄土浅层受热。", a15, a55));
            }
            if (alphaHit) {
                out.add(String.format("15 cm α=%.3f，白天峰应被压低；雨后三层一起抬才是入渗。", alpha));
            }
        }
        if (bal != null && bal.totals != null) {
            double pmm = num(bal, "precipMm");
            double et = num(bal, "etMm");
            if (!wz) {
                out.add(String.format("水平衡 P %.1f / ET %.1f mm，P 仅来自称重门限。", pmm, et));
            } else if (et > pmm + 2) {
                out.add(String.format("ET %.1f mm > P %.1f mm，符合旱作耗墒。", et, pmm));
            }
        }
        if (out.size() > 6) return new ArrayList<>(out.subList(0, 6));
        return out;
    }

    public static String warningLine(Map<String, Object> cov) {
        @SuppressWarnings("unchecked")
        List<String> w = cov == null ? null : (List<String>) cov.get("warnings");
        if (w == null || w.isEmpty()) return null;
        return String.join(" ", w);
    }

    private static Map<String, Object> span(long[] t, double[] y) {
        Map<String, Object> m = new LinkedHashMap<>();
        int n = t == null ? 0 : t.length;
        m.put("n", n);
        if (n == 0) {
            m.put("range", "缺");
            m.put("missingPct", 100.0);
            return m;
        }
        m.put("start", t[0]);
        m.put("end", t[n - 1]);
        m.put("range", rng(t));
        int miss = 0;
        int lim = y == null ? 0 : Math.min(y.length, n);
        for (int i = 0; i < lim; i++) if (!fin(y[i]) || Math.abs(y[i]) >= 9000) miss++;
        m.put("missingPct", n == 0 ? 100.0 : 100.0 * miss / n);
        return m;
    }

    private static boolean overlap(Tables.Weight w, Tables.Probe p) {
        if (w == null || p == null || w.n() == 0 || p.n() == 0) return false;
        return overlapTimes(w.t, p.t);
    }

    private static boolean overlap(Tables.Weight w, Tables.Weather z) {
        if (w == null || z == null || w.n() == 0 || z.n() == 0) return false;
        return overlapTimes(w.t, z.t);
    }

    private static boolean overlap(Tables.Probe p, Tables.Weather z) {
        if (p == null || z == null || p.n() == 0 || z.n() == 0) return false;
        return overlapTimes(p.t, z.t);
    }

    private static boolean overlapTimes(long[] a, long[] b) {
        return b[b.length - 1] >= a[0] && b[0] <= a[a.length - 1];
    }

    private static String rng(long[] t) {
        if (t == null || t.length == 0) return "缺";
        return DAY.format(Instant.ofEpochMilli(t[0])) + "至" + DAY.format(Instant.ofEpochMilli(t[t.length - 1]));
    }

    private static int countTrue(boolean[] a) {
        if (a == null) return 0;
        int c = 0;
        for (boolean b : a) if (b) c++;
        return c;
    }

    private static double firstFin(double[] y) {
        for (double v : y) if (fin(v)) return v;
        return Double.NaN;
    }

    private static double lastFin(double[] y) {
        for (int i = y.length - 1; i >= 0; i--) if (fin(y[i])) return y[i];
        return Double.NaN;
    }

    private static double diurnalAmp(long[] t, double[] y) {
        if (t == null || y == null || t.length < 12) return Double.NaN;
        Map<Integer, double[]> acc = new LinkedHashMap<>();
        int n = Math.min(t.length, y.length);
        for (int i = 0; i < n; i++) {
            if (!fin(y[i])) continue;
            int d = (int) Math.floor(t[i] / 86_400_000.0);
            double[] mm = acc.get(d);
            if (mm == null) acc.put(d, new double[]{y[i], y[i]});
            else {
                mm[0] = Math.min(mm[0], y[i]);
                mm[1] = Math.max(mm[1], y[i]);
            }
        }
        if (acc.size() < 3) return Double.NaN;
        double s = 0;
        for (double[] mm : acc.values()) s += mm[1] - mm[0];
        return s / acc.size();
    }

    private static double num(WaterBalanceEngine.Result bal, String k) {
        if (bal.totals == null || !bal.totals.containsKey(k)) return 0;
        Double v = bal.totals.get(k);
        return v == null ? 0 : v;
    }
}
