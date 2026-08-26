package com.hydro.smartwater.common;

import java.util.HashMap;
import java.util.Map;

public class R extends HashMap<String, Object> {
  public static R ok(Object data) {
    R r = new R();
    r.put("code", 0);
    r.put("data", data);
    r.put("msg", "ok");
    return r;
  }

  public static R ok() {
    return ok(null);
  }

  public static R fail(String msg) {
    R r = new R();
    r.put("code", 1);
    r.put("msg", msg);
    return r;
  }

  public R extra(String k, Object v) {
    put(k, v);
    return this;
  }

  public static Map<String, Object> page(Object records, long total) {
    Map<String, Object> m = new HashMap<>();
    m.put("records", records);
    m.put("total", total);
    return m;
  }
}
