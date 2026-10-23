package com.sflab.session;

import com.sflab.engine.FilterEngine;
import com.sflab.engine.QcEngine;
import com.sflab.engine.TempCorrectionEngine;
import com.sflab.engine.WaterBalanceEngine;
import com.sflab.model.Tables;

import java.util.LinkedHashMap;
import java.util.Map;

public class LabSession {
    public String id;
    public Tables.Weight weight = new Tables.Weight();
    public Tables.Probe probe = new Tables.Probe();
    public Tables.Weather weather = new Tables.Weather();
    public QcEngine.WeightFlags weightFlags;
    public QcEngine.ProbeFlags probeFlags;
    public byte[] weightGrade;
    public byte[] probeGrade;
    public Map<Long, Byte> weightOverride = new LinkedHashMap<>();
    public Map<Long, Byte> probeOverride = new LinkedHashMap<>();
    public TempCorrectionEngine.Result temp;
    public FilterEngine.Result filter;
    public WaterBalanceEngine.Result balance;
    public String filterMethod = "NONE";
    public String tempMethod = "B";
    public boolean free = true;
    public boolean snow = false;
    public String status = "empty";
    public String weatherNote;
    public String demoKind;
}
