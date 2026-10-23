package com.sflab.engine;

import com.sflab.model.Tables;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ReportEngine {

    public Map<String, Object> build(Tables.Weight w, byte[] wGrade, byte[] pGrade,
                                     TempCorrectionEngine.Result temp, WaterBalanceEngine.Result bal,
                                     String filterName, Map<String, Object> coverage, List<String> mechanisms, boolean demo) {
        Map<String, Object> out = new LinkedHashMap<>();
        String start = w.n() == 0 ? "—" : Instant.ofEpochMilli(w.t[0]).atZone(ZoneOffset.UTC).toLocalDateTime().toString().replace('T', ' ');
        String end = w.n() == 0 ? "—" : Instant.ofEpochMilli(w.t[w.n() - 1]).atZone(ZoneOffset.UTC).toLocalDateTime().toString().replace('T', ' ');
        int nW = wGrade == null ? 0 : wGrade.length;
        int e = 0, s = 0;
        if (wGrade != null) for (byte g : wGrade) { if (g == 2) e++; else if (g == 1) s++; }
        if (pGrade != null) for (byte g : pGrade) { if (g == 2) e++; }
        int nAll = nW + (pGrade == null ? 0 : pGrade.length);
        double errRate = nAll == 0 ? 0 : 100.0 * e / nAll;
        double susRate = nW == 0 ? 0 : 100.0 * s / nW;
        String a15 = "未算";
        if (temp != null && !temp.layers.isEmpty()) {
            var L = temp.layers.get(0);
            a15 = String.format("15 cm α=%.3f", L.alpha);
        }
        double p = num(bal, "precipMm");
        double et = num(bal, "etMm");
        double cl = num(bal, "closureMm");
        int pn = nOf(coverage, "probe");
        int zn = nOf(coverage, "weather");
        boolean wz = coverage != null && Boolean.TRUE.equals(coverage.get("weightWeather"));
        String site = demo ? "课堂示例" : "榆中萃英山";
        String align = wz ? "三类同期" : (zn == 0 ? "无气象" : "气象与称重错位，雨量/ET0 作废");
        String paragraph = String.format(
                "%s，%s 至 %s。称重 %d、探头 %d、气象 %d；%s。错误 %.1f%%，可疑 %.1f%%。%s，滤波 %s。P %.1f mm%s，ET %.1f mm，闭合差 %.1f mm。",
                site, start, end, w.n(), pn, zn, align, errRate, susRate, a15,
                filterName == null ? "无" : filterName, p, wz ? "" : "（仅称重门限）", et, cl);
        out.put("paragraph", paragraph);
        out.put("start", start);
        out.put("end", end);
        out.put("errorRate", errRate);
        out.put("suspectRate", susRate);
        out.put("totals", bal == null ? Map.of() : bal.totals);
        List<String> notes = new ArrayList<>();
        if (mechanisms != null) notes.addAll(mechanisms);
        out.put("notes", notes);
        return out;
    }

    @SuppressWarnings("unchecked")
    private int nOf(Map<String, Object> coverage, String key) {
        if (coverage == null) return 0;
        Object o = coverage.get(key);
        if (!(o instanceof Map<?, ?> m)) return 0;
        Object n = m.get("n");
        return n instanceof Number num ? num.intValue() : 0;
    }

    private double num(WaterBalanceEngine.Result bal, String k) {
        if (bal == null || bal.totals == null || !bal.totals.containsKey(k)) return 0;
        return bal.totals.get(k);
    }
}
