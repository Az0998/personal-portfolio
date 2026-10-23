package com.sflab.service;

import com.sflab.engine.Downsample;
import com.sflab.engine.FilterEngine;
import com.sflab.engine.MechanismEngine;
import com.sflab.engine.QcEngine;
import com.sflab.engine.ReportEngine;
import com.sflab.engine.Stats;
import com.sflab.engine.SyntheticDemo;
import com.sflab.engine.TempCorrectionEngine;
import com.sflab.engine.WaterBalanceEngine;
import com.sflab.model.Const;
import com.sflab.model.Tables;
import com.sflab.parse.TableParser;
import com.sflab.session.LabSession;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LabService {
    private final ConcurrentHashMap<String, LabSession> sessions = new ConcurrentHashMap<>();
    private final TableParser parser = new TableParser();
    private final QcEngine qc = new QcEngine();
    private final TempCorrectionEngine temp = new TempCorrectionEngine();
    private final FilterEngine filters = new FilterEngine();
    private final WaterBalanceEngine balance = new WaterBalanceEngine();
    private final ReportEngine report = new ReportEngine();
    private final JdbcTemplate jdbc;

    public LabService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public LabSession create() {
        LabSession s = new LabSession();
        s.id = UUID.randomUUID().toString().substring(0, 8);
        sessions.put(s.id, s);
        return s;
    }

    public LabSession get(String id) {
        LabSession s = sessions.get(id);
        if (s == null) throw new IllegalArgumentException("会话不存在，请重新载入示例或上传。");
        return s;
    }

    public LabSession loadDemo() {
        return loadDemo("class");
    }

    public LabSession loadDemo(String kind) {
        LabSession s = create();
        s.demoKind = kind == null || kind.isBlank() ? "matlab" : kind;
        s.weight = SyntheticDemo.weight();
        s.probe = SyntheticDemo.probe();
        s.weather = SyntheticDemo.weather();
        s.status = "loaded";
        run(s, defaultOpts());
        return s;
    }

    public LabSession upload(String id, MultipartFile weight, MultipartFile probe, MultipartFile weather) throws Exception {
        LabSession s = id == null || id.isBlank() ? create() : get(id);
        if (weight != null && !weight.isEmpty()) s.weight = parser.asWeight(parser.read(weight.getBytes(), weight.getOriginalFilename()));
        if (probe != null && !probe.isEmpty()) {
            try {
                s.probe = parser.asProbe(parser.read(probe.getBytes(), probe.getOriginalFilename()));
            } catch (Exception e) {
                throw new IllegalArgumentException("探头文件读失败：" + e.getMessage());
            }
        }
        if (weather != null && !weather.isEmpty()) {
            try {
                s.weather = parser.asWeather(parser.read(weather.getBytes(), weather.getOriginalFilename()));
                s.weatherNote = null;
            } catch (Exception e) {
                s.weather = new Tables.Weather();
                s.weatherNote = "气象文件没读进去（" + e.getMessage() + "）。称重和探头仍按上传结果计算。";
            }
        }
        if (s.weight.n() == 0) throw new IllegalArgumentException("称重没有解析出时间行。请确认有 Timestamp 与 L1_LYW / L1-LYW 列。");
        s.status = "loaded";
        run(s, defaultOpts());
        return s;
    }

    public Map<String, Object> defaultOpts() {
        Map<String, Object> o = new LinkedHashMap<>();
        o.put("filter", "MA");
        o.put("maWindow", 11);
        o.put("wmax", 31);
        o.put("deltaMax", 0.20);
        o.put("snap", true);
        o.put("interp", "LINEAR");
        o.put("tempMethod", "B");
        o.put("tref", Const.TREF_C);
        o.put("useRainMask", false);
        o.put("free", true);
        o.put("snow", false);
        return o;
    }

    public LabSession run(LabSession s, Map<String, Object> opts) {
        if (opts == null) opts = defaultOpts();
        s.filterMethod = str(opts, "filter", "NONE");
        s.tempMethod = str(opts, "tempMethod", "B");
        s.free = bool(opts, "free", true);
        s.snow = bool(opts, "snow", false);
        double[] tempOnW = Stats.interpTo(s.probe.t, firstTemp(s.probe), s.weight.t);
        s.weightFlags = qc.weight(s.weight, tempOnW);
        s.probeFlags = qc.probe(s.probe);
        qc.physical(s.weight, s.probe, s.weightFlags, s.probeFlags);
        s.weightGrade = applyOverride(s.weight.t, qc.weightGrade(s.weightFlags), s.weightOverride);
        s.probeGrade = applyOverride(s.probe.t, qc.probeGrade(s.probeFlags), s.probeOverride);
        s.temp = temp.run(s.probe, s.weather, s.tempMethod, num(opts, "tref", Const.TREF_C), bool(opts, "useRainMask", false));
        boolean[] drop = dropMask(s);
        double[] sys = systemKg(s);
        s.filter = filters.run(sys, drop, s.filterMethod, (int) num(opts, "maWindow", 11),
                (int) num(opts, "wmax", 31), num(opts, "deltaMax", 0.20),
                bool(opts, "snap", true), str(opts, "interp", "LINEAR"));
        double[][] theta = new double[3][];
        for (int d = 0; d < 3; d++) theta[d] = s.temp.layers.get(d).correctedPct;
        s.balance = balance.run(s.weight, s.weightFlags, s.filter.filteredMm, s.probe, theta, s.weather, s.free, s.snow);
        s.status = "ready";
        return s;
    }

    public Map<String, Object> meta(LabSession s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.id);
        m.put("status", s.status);
        m.put("weightRows", s.weight.n());
        m.put("probeRows", s.probe.n());
        m.put("weatherRows", s.weather.n());
        if (s.weight.n() > 0) {
            m.put("start", s.weight.t[0]);
            m.put("end", s.weight.t[s.weight.n() - 1]);
        }
        Map<String, Object> cov = MechanismEngine.coverage(s.weight, s.probe, s.weather, s.weatherNote);
        m.put("coverage", cov);
        m.put("overlap", Boolean.TRUE.equals(cov.get("weightWeather")));
        List<String> mech = MechanismEngine.lines(s.weight, s.probe, s.weather, s.weightFlags, s.probeFlags, s.temp, s.balance, s.demoKind != null);
        m.put("mechanisms", mech);
        String warn = MechanismEngine.warningLine(cov);
        if (warn != null) m.put("warning", warn);
        m.put("areaM2", Const.AREA_M2);
        m.put("mmPerKg", Const.MM_PER_KG);
        m.put("gateMm", Const.MASS_GATE_MM);
        m.put("filter", s.filterMethod);
        m.put("tempMethod", s.tempMethod);
        m.put("free", s.free);
        m.put("snow", s.snow);
        if (s.weightGrade != null) {
            int e = 0, q = 0;
            for (byte g : s.weightGrade) { if (g == 2) e++; if (g == 1) q++; }
            m.put("weightError", e);
            m.put("weightSuspect", q);
        }
        if (s.temp != null) {
            List<Map<String, Object>> layers = new ArrayList<>();
            for (var L : s.temp.layers) {
                Map<String, Object> x = new LinkedHashMap<>();
                x.put("layer", L.layer);
                x.put("label", L.label);
                x.put("alpha", L.alpha);
                x.put("daysUsed", L.daysUsed);
                x.put("daysDropped", L.daysDropped);
                x.put("relChangePct", L.relChangePct);
                layers.add(x);
            }
            m.put("tempLayers", layers);
        }
        if (s.balance != null) m.put("totals", s.balance.totals);
        m.put("notes", notes(s));
        if (s.demoKind != null) {
            m.put("demoKind", s.demoKind);
            m.put("simTruth", SyntheticDemo.truth());
        }
        return m;
    }

    public Map<String, Object> series(LabSession s, String group, Long from, Long to, int maxPoints) {
        Map<String, double[]> ys = new LinkedHashMap<>();
        long[] t;
        switch (group == null ? "weight" : group) {
            case "probe" -> {
                t = s.probe.t;
                ys.put("echo1", s.probe.echo[0]);
                ys.put("echo2", s.probe.echo[1]);
                ys.put("echo3", s.probe.echo[2]);
                if (s.temp != null) {
                    ys.put("echo1c", s.temp.layers.get(0).correctedPct);
                    ys.put("echo2c", s.temp.layers.get(1).correctedPct);
                    ys.put("echo3c", s.temp.layers.get(2).correctedPct);
                }
                ys.put("temp1", s.probe.temp[0]);
                ys.put("temp2", s.probe.temp[1]);
                ys.put("temp3", s.probe.temp[2]);
                ys.put("ec1", s.probe.ec[0]);
                ys.put("ec2", s.probe.ec[1]);
                ys.put("ec3", s.probe.ec[2]);
                ys.put("mps1", s.probe.mps[0]);
                ys.put("mps2", s.probe.mps[1]);
                ys.put("mps3", s.probe.mps[2]);
                ys.put("vtens", s.probe.vtens);
                ys.put("ref", s.probe.refTens);
            }
            case "weather" -> {
                t = s.weather.t;
                ys.put("precip", s.weather.precip);
                ys.put("airT", s.weather.airT);
                ys.put("rh", s.weather.rh);
                ys.put("rs", s.weather.rs);
                ys.put("wind", s.weather.wind);
            }
            case "filter" -> {
                t = s.weight.t;
                ys.put("rawMm", s.filter == null ? new double[0] : s.filter.rawMm);
                ys.put("filteredMm", s.filter == null ? new double[0] : s.filter.filteredMm);
            }
            default -> {
                t = s.weight.t;
                ys.put("lyw", s.weight.lyw);
                ys.put("sww", s.weight.sww);
                ys.put("pumpIn", s.weight.pumpIn);
                ys.put("pumpOut", s.weight.pumpOut);
                ys.put("lywAnomMm", anomalyMm(s.weight.lyw));
                ys.put("swwAnomMm", anomalyMm(s.weight.sww));
            }
        }
        Map<String, Object> pack = Downsample.minMax(t, ys, from, to, Math.max(400, maxPoints));
        pack.put("group", group);
        if ("weight".equals(group) || group == null) {
            pack.put("marks", markRuns(s.weight.t, s.weightFlags, from, to));
            pack.put("grade", gradeRuns(s.weight.t, s.weightGrade, from, to));
        }
        if ("probe".equals(group)) {
            pack.put("marks", probeMarkRuns(s.probe.t, s.probeFlags, from, to));
            pack.put("grade", gradeRuns(s.probe.t, s.probeGrade, from, to));
        }
        if ("weight".equals(group) || group == null) {
            pack.put("pumpEvents", pumpEvents(s));
            pack.put("pumpNote", pumpNote(s));
        }
        return pack;
    }

    public Map<String, Object> tempDetail(LabSession s) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (s.temp == null) return out;
        List<Map<String, Object>> layers = new ArrayList<>();
        for (var L : s.temp.layers) {
            Map<String, Object> x = new LinkedHashMap<>();
            x.put("layer", L.layer);
            x.put("label", L.label);
            x.put("alpha", L.alpha);
            x.put("daysUsed", L.daysUsed);
            x.put("daysDropped", L.daysDropped);
            x.put("relChangePct", L.relChangePct);
            x.put("scatter", L.scatter);
            x.put("acfRaw", L.acfRaw);
            x.put("acfCorr", L.acfCorr);
            layers.add(x);
        }
        out.put("method", s.temp.method);
        out.put("tref", s.temp.tref);
        out.put("layers", layers);
        out.put("notes", s.temp.notes);
        return out;
    }

    public Map<String, Object> balancePayload(LabSession s) {
        Map<String, Object> out = new LinkedHashMap<>();
        if (s.balance == null) return out;
        out.put("daily", s.balance.daily);
        out.put("flux", downsampleFlux(s.balance.flux, 1500));
        out.put("filteredFlux", downsampleFlux(s.balance.filteredFlux, 1500));
        out.put("totals", s.balance.totals);
        out.put("notes", s.balance.notes);
        return out;
    }

    public Map<String, Object> flagsTable(LabSession s, String stream, int page, int size, boolean onlyFlagged) {
        boolean probe = "probe".equals(stream);
        long[] t = probe ? s.probe.t : s.weight.t;
        byte[] g = probe ? s.probeGrade : s.weightGrade;
        List<Integer> idx = new ArrayList<>();
        if (g != null) {
            for (int i = 0; i < g.length; i++) {
                if (!onlyFlagged || g[i] != 0) idx.add(i);
            }
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        int from = Math.max(0, page * size);
        int to = Math.min(idx.size(), from + size);
        for (int k = from; k < to; k++) {
            int i = idx.get(k);
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("i", i);
            r.put("t", t[i]);
            r.put("flag", g[i]);
            r.put("reason", probe ? probeReason(s, i) : weightReason(s, i));
            rows.add(r);
        }
        return Map.of("rows", rows, "total", idx.size());
    }

    public void overrideFlag(LabSession s, String stream, long t, int flag, String reason) {
        if (flag < 0 || flag > 2) throw new IllegalArgumentException("flag 只能是 0、1、2。");
        boolean probe = "probe".equals(stream);
        Map<Long, Byte> map = probe ? s.probeOverride : s.weightOverride;
        map.put(t, (byte) flag);
        jdbc.update("""
                MERGE INTO flag_override (session_id, stream, t_ms, flag, reason)
                KEY (session_id, stream, t_ms) VALUES (?,?,?,?,?)
                """, s.id, stream, t, flag, reason);
        if (probe) s.probeGrade = applyOverride(s.probe.t, qc.probeGrade(s.probeFlags), s.probeOverride);
        else s.weightGrade = applyOverride(s.weight.t, qc.weightGrade(s.weightFlags), s.weightOverride);
    }

    public Map<String, Object> report(LabSession s) {
        Map<String, Object> cov = MechanismEngine.coverage(s.weight, s.probe, s.weather, s.weatherNote);
        List<String> mech = MechanismEngine.lines(s.weight, s.probe, s.weather, s.weightFlags, s.probeFlags, s.temp, s.balance, s.demoKind != null);
        return report.build(s.weight, s.weightGrade, s.probeGrade, s.temp, s.balance, s.filterMethod, cov, mech, s.demoKind != null);
    }

    private byte[] applyOverride(long[] t, byte[] auto, Map<Long, Byte> ov) {
        byte[] g = auto.clone();
        for (int i = 0; i < t.length; i++) {
            Byte v = ov.get(t[i]);
            if (v != null) g[i] = v;
        }
        return g;
    }

    private double[] firstTemp(Tables.Probe p) {
        if (p == null || p.n() == 0) return new double[0];
        if (p.bottomTemp.length > 0) return p.bottomTemp;
        return p.temp[0];
    }

    private List<String> notes(LabSession s) {
        List<String> n = new ArrayList<>(MechanismEngine.lines(s.weight, s.probe, s.weather, s.weightFlags, s.probeFlags, s.temp, s.balance, s.demoKind != null));
        if (s.probeFlags != null && s.probe.n() > 0) {
            int gap = 0;
            for (boolean b : s.probeFlags.feedbackGap) if (b) gap++;
            if (gap > 200) n.add("VTENS 全程偏移，记状态，不刷满旗标。");
            for (int d = 0; d < 3; d++) {
                int c = 0;
                for (boolean b : s.probeFlags.mpsRange[d]) if (b) c++;
                if (s.probeFlags.mpsRange[d].length > 0 && c > 0.5 * s.probeFlags.mpsRange[d].length) {
                    n.add(Const.LAYER_LABEL[d] + " 水势超量程，记状态。");
                }
            }
        }
        return n;
    }

    private List<Map<String, Object>> markRuns(long[] t, QcEngine.WeightFlags f, Long from, Long to) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (f == null) return out;
        addRuns(out, t, f.spike, "spike", from, to);
        addRuns(out, t, f.wind, "wind", from, to);
        addRuns(out, t, f.wall, "wall", from, to);
        addRuns(out, t, f.step, "step", from, to);
        addRuns(out, t, f.bottle, "bottle", from, to);
        addRuns(out, t, f.pump, "pump", from, to);
        addRuns(out, t, f.inferredPump, "inferPump", from, to);
        addRuns(out, t, f.rainlessJump, "rainless", from, to);
        addRuns(out, t, f.missingW, "missing", from, to);
        return out;
    }

    private void addRuns(List<Map<String, Object>> out, long[] t, boolean[] m, String code, Long from, Long to) {
        int i = 0;
        while (i < m.length) {
            if (!m[i]) { i++; continue; }
            int j = i;
            while (j < m.length && m[j]) j++;
            long a = t[i], b = t[Math.min(j - 1, t.length - 1)];
            if ((from == null || b >= from) && (to == null || a <= to)) {
                out.add(Map.of("code", code, "t0", a, "t1", b, "n", j - i));
            }
            i = j;
        }
    }

    private List<Map<String, Object>> gradeRuns(long[] t, byte[] g, Long from, Long to) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (g == null) return out;
        int i = 0;
        while (i < g.length) {
            byte v = g[i];
            int j = i;
            while (j < g.length && g[j] == v) j++;
            if (v != 0) {
                long a = t[i], b = t[j - 1];
                if ((from == null || b >= from) && (to == null || a <= to)) {
                    out.add(Map.of("flag", (int) v, "t0", a, "t1", b, "n", j - i));
                }
            }
            i = j;
        }
        return out;
    }

    private List<WaterBalanceEngine.Flux10> downsampleFlux(List<WaterBalanceEngine.Flux10> src, int max) {
        if (src == null || src.size() <= max) return src;
        int step = (int) Math.ceil(src.size() / (double) max);
        List<WaterBalanceEngine.Flux10> out = new ArrayList<>();
        for (int i = 0; i < src.size(); i += step) out.add(src.get(i));
        return out;
    }

    private String weightReason(LabSession s, int i) {
        QcEngine.WeightFlags f = s.weightFlags;
        if (f.missingW[i]) return "缺测 10.4.3";
        if (f.overload[i]) return "超量程 2.3";
        if (f.spike[i]) return "孤立尖峰 10.4.3";
        if (f.wind[i]) return "风振 10.4.2.3";
        if (f.wall[i]) return "碰壁 10.4.2.1";
        if (f.bottle[i]) return "储水瓶台阶 10.2";
        if (f.step[i]) return "重量台阶 10.4.3";
        if (f.pump[i]) return "泵脉冲 10.1";
        if (f.inferredPump[i]) return "推断内部调水（LYW/SWW 互补）";
        if (f.rainlessJump[i]) return "无雨回跳：增重随后退回";
        if (f.irregular[i]) return "间隔异常 10.4.3";
        return "正确";
    }

    private String probeReason(LabSession s, int i) {
        QcEngine.ProbeFlags f = s.probeFlags;
        if (f.sentinel[i]) return "哨兵值/超量程";
        if (f.vtensAir[i]) return "VTENS 进气 3.4";
        if (f.inversion[i]) return "层序反常：深层先动/浅层未动";
        if (f.orphanVwc[i]) return "无雨抬升：θ 动了但称重未过门限";
        if (f.diurnalT[i]) return "日周期介电：θ 与土温同步，像辐射/温度假信号";
        if (f.hfWiggle[i]) return "高频无雨起伏：不像入渗";
        for (int d = 0; d < 3; d++) {
            if (f.mpsRange[d][i]) return "MPS 超量程 3.2";
            if (f.mpsSat[d][i]) return "MPS 近饱和 3.2";
        }
        if (f.feedbackBand[i]) return "超出反馈区间 4.3";
        if (f.feedbackGap[i]) return "未跟上参比 4.2";
        return "正确";
    }

    private List<Map<String, Object>> probeMarkRuns(long[] t, QcEngine.ProbeFlags f, Long from, Long to) {
        List<Map<String, Object>> out = new ArrayList<>();
        if (f == null) return out;
        addRuns(out, t, f.orphanVwc, "orphan", from, to);
        addRuns(out, t, f.diurnalT, "diurnal", from, to);
        addRuns(out, t, f.inversion, "inversion", from, to);
        addRuns(out, t, f.hfWiggle, "wiggle", from, to);
        return out;
    }

    private List<Map<String, Object>> pumpEvents(LabSession s) {
        List<Map<String, Object>> out = new ArrayList<>();
        Tables.Weight w = s.weight;
        for (int i = 0; i < w.n(); i++) {
            double pin = i < w.pumpIn.length && Double.isFinite(w.pumpIn[i]) ? w.pumpIn[i] : 0;
            double pout = i < w.pumpOut.length && Double.isFinite(w.pumpOut[i]) ? w.pumpOut[i] : 0;
            boolean inf = s.weightFlags != null && s.weightFlags.inferredPump[i];
            if (pin <= 0 && pout <= 0 && !inf) continue;
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("t", w.t[i]);
            r.put("in", pin);
            r.put("out", pout);
            r.put("inferred", inf);
            out.add(r);
            if (out.size() >= 4000) break;
        }
        return out;
    }

    private String pumpNote(LabSession s) {
        int nIn = 0, nOut = 0, nInf = 0;
        for (int i = 0; i < s.weight.n(); i++) {
            if (Double.isFinite(s.weight.pumpIn[i]) && s.weight.pumpIn[i] > 0) nIn++;
            if (Double.isFinite(s.weight.pumpOut[i]) && s.weight.pumpOut[i] > 0) nOut++;
            if (s.weightFlags != null && s.weightFlags.inferredPump[i]) nInf++;
        }
        if (nIn + nOut == 0 && nInf == 0) {
            return "Pump_in / Pump_out 列已读到，但这一段全是 0，也称重上没有 LYW 与 SWW 互补的内部调水。空柱不是画坏了：这段没有泵事件。";
        }
        if (nIn + nOut == 0) {
            return "泵秒数全是 0，但有 " + nInf + " 处 LYW 与 SWW 一升一降、量级接近，按内部调水可疑标出（不是降雨）。";
        }
        return "记录到 Pump_in " + nIn + " 分钟、Pump_out " + nOut + " 分钟"
                + (nInf > 0 ? "，另有 " + nInf + " 处互补调水推断。" : "。");
    }

    private String str(Map<String, Object> o, String k, String d) {
        Object v = o.get(k);
        return v == null ? d : v.toString();
    }

    private boolean bool(Map<String, Object> o, String k, boolean d) {
        Object v = o.get(k);
        if (v instanceof Boolean b) return b;
        if (v == null) return d;
        return Boolean.parseBoolean(v.toString());
    }

    private double num(Map<String, Object> o, String k, double d) {
        Object v = o.get(k);
        if (v instanceof Number n) return n.doubleValue();
        if (v == null) return d;
        try { return Double.parseDouble(v.toString()); } catch (NumberFormatException e) { return d; }
    }

    private double[] anomalyMm(double[] y) {
        double y0 = Double.NaN;
        for (double v : y) {
            if (Double.isFinite(v)) { y0 = v; break; }
        }
        double[] out = new double[y.length];
        for (int i = 0; i < y.length; i++) {
            out[i] = Double.isFinite(y[i]) && Double.isFinite(y0) ? (y[i] - y0) * Const.MM_PER_KG : Double.NaN;
        }
        return out;
    }

    public Map<String, Object> compareFilters(LabSession s) {
        boolean[] drop = dropMask(s);
        double[] sys = systemKg(s);
        Map<String, double[]> ys = new LinkedHashMap<>();
        FilterEngine.Result raw = filters.run(sys, drop, "NONE", 11, 31, 0.20, true, "LINEAR");
        double[] none = raw.filteredMm;
        double[] ma = filters.run(sys, drop, "MA", 11, 31, 0.20, true, "LINEAR").filteredMm;
        double[] lin = filters.run(sys, drop, "LINEAR", 11, 31, 0.20, true, "LINEAR").filteredMm;
        double[] aw = filters.run(sys, drop, "AWAT", 11, 31, 0.20, true, "LINEAR").filteredMm;
        ys.put("raw", raw.rawMm);
        ys.put("NONE", none);
        ys.put("MA", ma);
        ys.put("LINEAR", lin);
        ys.put("AWAT", aw);
        ys.put("resMA", minusArr(raw.rawMm, ma));
        ys.put("resLINEAR", minusArr(raw.rawMm, lin));
        ys.put("resAWAT", minusArr(raw.rawMm, aw));
        Map<String, Object> pack = Downsample.minMax(s.weight.t, ys, null, null, 2200);
        pack.put("current", s.filterMethod);
        List<Map<String, Object>> stats = new ArrayList<>();
        stats.add(filterStat("NONE", raw.rawMm, none));
        stats.add(filterStat("MA", raw.rawMm, ma));
        stats.add(filterStat("LINEAR", raw.rawMm, lin));
        stats.add(filterStat("AWAT", raw.rawMm, aw));
        pack.put("stats", stats);
        pack.put("note", "四条全序列会几乎重合，因为差别在 0.1 mm 量级。看残差表和残差图：MA 抹雨峰，AWAT 吃掉噪声台阶，LINEAR 只填缺口。");
        return pack;
    }

    private double[] minusArr(double[] a, double[] b) {
        double[] d = new double[a.length];
        for (int i = 0; i < a.length; i++) {
            d[i] = (i < b.length && Double.isFinite(a[i]) && Double.isFinite(b[i])) ? a[i] - b[i] : Double.NaN;
        }
        return d;
    }

    private Map<String, Object> filterStat(String id, double[] raw, double[] y) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        double s = 0, s2 = 0, maxAbs = 0;
        int c = 0;
        double peakRaw = 0, peakY = 0;
        int n = Math.min(raw.length, y.length);
        for (int i = 0; i < n; i++) {
            if (!Double.isFinite(raw[i]) || !Double.isFinite(y[i])) continue;
            double d = raw[i] - y[i];
            s += d;
            s2 += d * d;
            maxAbs = Math.max(maxAbs, Math.abs(d));
            c++;
        }
        int win = Math.min(360, Math.max(30, n / 50));
        for (int i = 0; i + win < n; i += Math.max(1, win / 6)) {
            if (!Double.isFinite(raw[i]) || !Double.isFinite(raw[i + win])) continue;
            peakRaw = Math.max(peakRaw, raw[i + win] - raw[i]);
            if (Double.isFinite(y[i]) && Double.isFinite(y[i + win])) peakY = Math.max(peakY, y[i + win] - y[i]);
        }
        m.put("n", c);
        m.put("rmse", c == 0 ? 0 : Math.sqrt(s2 / c));
        m.put("maxAbs", maxAbs);
        m.put("meanBias", c == 0 ? 0 : s / c);
        m.put("peak6hRaw", peakRaw);
        m.put("peak6h", peakY);
        m.put("peakLost", peakRaw - peakY);
        return m;
    }

    public Map<String, Object> flagSummary(LabSession s, String stream) {
        boolean probe = "probe".equals(stream);
        byte[] g = probe ? s.probeGrade : s.weightGrade;
        long[] t = probe ? s.probe.t : s.weight.t;
        Map<String, Object> out = new LinkedHashMap<>();
        int n0 = 0, n1 = 0, n2 = 0;
        Map<String, Integer> reasons = new LinkedHashMap<>();
        List<Map<String, Object>> points = new ArrayList<>();
        if (g != null) {
            for (int i = 0; i < g.length; i++) {
                if (g[i] == 0) n0++;
                else if (g[i] == 1) n1++;
                else n2++;
                if (g[i] != 0) {
                    String why = probe ? probeReason(s, i) : weightReason(s, i);
                    reasons.merge(why, 1, Integer::sum);
                    if (points.size() < 1800) {
                        Map<String, Object> p = new LinkedHashMap<>();
                        p.put("t", t[i]);
                        p.put("flag", g[i]);
                        p.put("reason", why);
                        p.put("y", probe ? s.probe.echo[0][Math.min(i, s.probe.echo[0].length - 1)]
                                : (i < s.weight.lyw.length ? (s.weight.lyw[i] - s.weight.lyw[0]) * Const.MM_PER_KG : 0));
                        points.add(p);
                    }
                }
            }
        }
        out.put("n0", n0);
        out.put("n1", n1);
        out.put("n2", n2);
        out.put("reasons", reasons);
        out.put("points", points);
        return out;
    }

    private boolean[] dropMask(LabSession s) {
        boolean[] drop = new boolean[s.weight.n()];
        if (s.weightFlags == null) return drop;
        for (int i = 0; i < drop.length; i++) drop[i] = s.weightFlags.spike[i] || s.weightFlags.wind[i] || s.weightFlags.pump[i];
        return drop;
    }

    private double[] systemKg(LabSession s) {
        double[] sys = new double[s.weight.n()];
        double[] lywC = Stats.withoutSteps(s.weight.lyw, 0.05);
        double[] swwC = Stats.withoutSteps(Stats.holdLast(s.weight.sww), 0.05);
        for (int i = 0; i < sys.length; i++) {
            if (!Double.isFinite(lywC[i])) sys[i] = Double.NaN;
            else sys[i] = Double.isFinite(swwC[i]) ? lywC[i] + swwC[i] : lywC[i];
        }
        return sys;
    }

}
