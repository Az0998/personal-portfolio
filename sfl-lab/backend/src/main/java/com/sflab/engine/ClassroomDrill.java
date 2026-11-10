package com.sflab.engine;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Three in-class judgments. Keys stay on the server until submit. */
public final class ClassroomDrill {
    private ClassroomDrill() {}

    public static List<Map<String, Object>> questions(boolean demo) {
        List<Map<String, Object>> q = new ArrayList<>();
        if (demo) {
            q.add(item("winB",
                    "窗口 B（6-05 18:30–20:00）质量跳变应记为？",
                    opt("rain", "降水"),
                    opt("pump", "泵排出（内部调水）"),
                    opt("wind", "风振")));
        } else {
            q.add(item("pumpP",
                    "泵把水从补水桶抽到土柱，应记入降水 P 吗？",
                    opt("yes", "应记入 P"),
                    opt("no", "不应记入 P 或 ET"),
                    opt("gate", "过 5 g 门限就算雨")));
        }
        q.add(item("diel",
                "15 cm 白天 θ 与土温同步抬升，优先当作？",
                opt("infil", "入渗锋面"),
                opt("diel", "介电假湿，要订正"),
                opt("up", "深层向上补给")));
        q.add(item("et0",
                "气象算出的 ET0 是？",
                opt("eta", "蒸渗仪实测 ETa"),
                opt("ref", "参考蒸散，不是 ETa"),
                opt("same", "等于水平衡里的 ET")));
        return q;
    }

    public static Map<String, Object> grade(boolean demo, Map<String, String> picks) {
        Map<String, String> keys = keys(demo);
        Map<String, String> why = explain(demo);
        List<Map<String, Object>> items = new ArrayList<>();
        int ok = 0;
        for (Map<String, Object> q : questions(demo)) {
            String id = String.valueOf(q.get("id"));
            String pick = picks == null ? "" : String.valueOf(picks.getOrDefault(id, "")).trim();
            String right = keys.get(id);
            boolean hit = right != null && right.equals(pick);
            if (hit) ok++;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", id);
            row.put("prompt", q.get("prompt"));
            row.put("pick", pick);
            row.put("right", right);
            row.put("ok", hit);
            row.put("explain", why.get(id));
            if ("winB".equals(id)) row.put("window", "B");
            if ("diel".equals(id)) row.put("window", "E");
            items.add(row);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("n", items.size());
        out.put("ok", ok);
        out.put("items", items);
        return out;
    }

    static Map<String, String> keys(boolean demo) {
        Map<String, String> k = new LinkedHashMap<>();
        k.put(demo ? "winB" : "pumpP", demo ? "pump" : "no");
        k.put("diel", "diel");
        k.put("et0", "ref");
        return k;
    }

    static Map<String, String> explain(boolean demo) {
        Map<String, String> e = new LinkedHashMap<>();
        e.put("winB", "19:00 是泵排出。雨在当天下午 14–18h（窗口 A），泵不是雨。");
        e.put("pumpP", "泵是土柱与补水桶之间的内部调水，不记入 P 或 ET。");
        e.put("diel", "θ 跟土温同位相先当介电假湿。Kapilaratne 只订 5TE 的 θ。");
        e.put("et0", "ET0 是参考蒸散，不是蒸渗仪实测 ETa。土柱未必充分供水。");
        if (!demo) e.remove("winB");
        else e.remove("pumpP");
        return e;
    }

    @SafeVarargs
    private static Map<String, Object> item(String id, String prompt, Map<String, String>... opts) {
        Map<String, Object> q = new LinkedHashMap<>();
        q.put("id", id);
        q.put("prompt", prompt);
        q.put("options", List.of(opts));
        return q;
    }

    private static Map<String, String> opt(String id, String label) {
        Map<String, String> o = new LinkedHashMap<>();
        o.put("id", id);
        o.put("label", label);
        return o;
    }
}
